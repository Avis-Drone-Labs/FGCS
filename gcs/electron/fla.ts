/*
This file contains the logic for parsing different types of log files on the main electron process.
*/

import { WebContents } from "electron"
import fs from "fs"
import readline from "readline"

import createRecentLogsManager from "./utils/recentLogManager"

import DataflashParser from "./utils/dataflashParser"

import {
  getAircraftTypeFromMavType,
  getFormatMessages,
  transformMessages,
} from "./utils/dataflashParserUtils"

import type {
  AircraftType,
  Dataset,
  FormatMessage,
  LogSummary,
  LogType,
  MessageObject,
  Messages,
  ParseResult,
} from "./types/flaTypes"

import {
  buildDefaultMessageFilters,
  calcGPSOffset,
  calculateMeanValues,
  convertTimeUStoUTC,
  expandBATMessages,
  expandESCMessages,
  getFileExtension,
  processFlightModes,
  sortObjectByKeys,
} from "./utils/flaUtils"

const UPDATE_THROTTLE_MS = 100 // Update every 100ms
const recentLogsManager = createRecentLogsManager()
let logData: Messages | null = null
let defaultMessageFilters: Record<string, unknown> = {}

async function parseDataflashLogFile(
  rl: readline.Interface,
  fileStream: fs.ReadStream,
  fileSize: number,
  webContents: WebContents,
): Promise<Messages> {
  // https://ardupilot.org/copter/docs/logmessages.html
  // https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_Logger

  return new Promise((resolve, reject) => {
    const stringTypes = new Set(["n", "N", "Z", "M"])
    let aircraftType: AircraftType = null
    let lastUpdateTime = 0

    const formatMessages: { [key: string]: FormatMessage } = {}
    const units: { [key: string]: string } = {}
    const messages: Messages = {
      format: formatMessages,
      aircraftType: null,
    }

    rl.on("line", (line: string) => {
      // Skip empty lines early
      if (!line || line.length < 3) return

      // Optimized splitting - avoid trim on every element
      const splitLineData = line.split(",")
      const messageName = splitLineData[0].trim()
      if (messageName === "FMT") {
        // Message defining the format of messages in this file
        const definedMessageType = parseInt(splitLineData[1])
        const definedMessageName = splitLineData[3].trim()
        const definedMessageFormat = splitLineData[4].trim()
        const fields = splitLineData.slice(5).map((f) => f.trim())

        formatMessages[definedMessageName] = {
          name: definedMessageName,
          type: definedMessageType,
          format: definedMessageFormat,
          fields,
        }
      } else if (messageName === "UNIT") {
        // Message mapping from single character to SI unit
        const unitId = splitLineData[2]?.trim()
        const unitName = splitLineData[3]?.trim()
        if (unitId && unitName) {
          const unitCharCode = parseInt(unitId)
          if (!isNaN(unitCharCode)) {
            units[String.fromCharCode(unitCharCode)] = unitName
          }
        }
      } else if (messageName === "FMTU") {
        // Message defining units and multipliers used for fields of other messages
        const messageType = parseInt(splitLineData[2])
        const messageUnits = splitLineData[3]?.trim()
        const messageMultiplier = splitLineData[4]?.trim()

        // Cache format message names to avoid repeated Object.keys() calls
        for (const formatMessageName in formatMessages) {
          const formatMessage = formatMessages[formatMessageName]
          if (formatMessage.type === messageType) {
            formatMessage.units = messageUnits
            formatMessage.multipliers = messageMultiplier
          }
        }
      } else if (messageName === "MULT") {
        // Message mapping from single character to numeric multiplier
      } else if (messageName === "PARM") {
        // Parameter value
        if (
          splitLineData[2]?.trim() === "Q_ENABLE" &&
          splitLineData[3]?.trim() === "1"
        ) {
          aircraftType = "quadplane"
        }
      } else if (messageName === "FILE") {
        // File data
      } else if (messageName === "MSG") {
        // MSG data
        const text = splitLineData[2]?.trim()

        if (aircraftType === null && text) {
          const lowerText = text.toLowerCase()
          if (lowerText.includes("arduplane")) {
            aircraftType = "plane"
          } else if (lowerText.includes("arducopter")) {
            aircraftType = "copter"
          }
        }
      } else {
        // Message data
        const formatMessage = formatMessages[messageName]
        if (formatMessage) {
          if (!messages[messageName]) {
            messages[messageName] = []
          }

          const messageObj: MessageObject = {
            name: messageName,
          }

          const fields = formatMessage.fields
          const format = formatMessage.format
          const fieldsLength = fields.length

          for (
            let i = 0;
            i < fieldsLength && i < splitLineData.length - 1;
            i++
          ) {
            const field = fields[i]
            const formatType = format[i]
            const value = splitLineData[i + 1]?.trim()

            if (value !== undefined && value !== "") {
              if (stringTypes.has(formatType)) {
                messageObj[field] = value
              } else {
                const numValue = parseFloat(value)
                messageObj[field] = isNaN(numValue) ? 0 : numValue
              }
            }
          }

          ;(messages[messageName] as MessageObject[]).push(messageObj)
        }
      }

      const now = Date.now()
      if (now - lastUpdateTime > UPDATE_THROTTLE_MS) {
        lastUpdateTime = now
        const percent = Math.round((fileStream.bytesRead / fileSize) * 100)
        webContents.send("fla:log-parse-progress", { percent })
      }
    })

    rl.on("close", () => {
      // Convert units strings to arrays of actual unit descriptions
      Object.values(formatMessages).forEach((formatMessage) => {
        if (formatMessage.units && typeof formatMessage.units === "string") {
          const unitsArray: string[] = []
          for (let i = 0; i < formatMessage.units.length; i++) {
            const unitChar = formatMessage.units[i]
            const unitDescription = units[unitChar] || "UNKNOWN"
            unitsArray.push(unitDescription)
          }
          // Replace the string with the array
          formatMessage.units = unitsArray
        }

        // Convert multipliers strings to arrays of individual multiplier characters
        if (
          formatMessage.multipliers &&
          typeof formatMessage.multipliers === "string"
        ) {
          const multipliersArray: string[] = []
          for (let i = 0; i < formatMessage.multipliers.length; i++) {
            const multiplierChar = formatMessage.multipliers[i]
            multipliersArray.push(multiplierChar)
          }
          // Replace the string with the array
          formatMessage.multipliers = multipliersArray
        }
      })

      // Add format messages to messages for later digesting and return
      messages["format"] = formatMessages
      messages["aircraftType"] = aircraftType

      webContents.send("fla:log-parse-progress", {
        percent: 100,
      })
      resolve(messages)
    })

    rl.on("error", (err: Error) => {
      console.error("Error reading log file:", err)
      reject(err)
    })
  })
}

async function parseFgcsTelemetryLogFile(
  rl: readline.Interface,
  fileStream: fs.ReadStream,
  fileSize: number,
  webContents: WebContents,
): Promise<Messages> {
  const formatMessages: { [key: string]: FormatMessage } = {}
  const messages: Messages = {
    format: formatMessages,
    aircraftType: null,
  }

  let lastUpdateTime = 0

  return new Promise((resolve, reject) => {
    rl.on("line", (line: string) => {
      if (!line || line.length < 5 || line.includes("==")) {
        return
      }

      const splitLineData = line.split(",")
      const timestamp = parseFloat(splitLineData[0])
      const messageName = splitLineData[1]?.trim()

      // TODO: Don't skip these messages
      if (
        !messageName ||
        messageName === "STATUSTEXT" ||
        messageName === "BATTERY_STATUS" ||
        messageName === "ESC_TELEMETRY_1_TO_4"
      ) {
        return
      }

      const messageData = splitLineData.slice(2)

      // Get field names and cache format
      if (!formatMessages[messageName]) {
        const fields: string[] = []
        for (let i = 0; i < messageData.length; i++) {
          const keyVal = messageData[i]?.trim()
          if (keyVal) {
            const colonIndex = keyVal.indexOf(":")
            if (colonIndex > 0) {
              fields.push(keyVal.substring(0, colonIndex))
            }
          }
        }
        formatMessages[messageName] = {
          fields,
          name: messageName,
          type: 0,
          format: "",
        }
      }

      const messageObj: MessageObject = {
        TimeUS: Math.round(timestamp * 1000), // Use round instead of parseInt for better precision
        name: messageName,
      }

      for (let i = 0; i < messageData.length; i++) {
        const keyVal = messageData[i]?.trim()
        if (keyVal) {
          const colonIndex = keyVal.indexOf(":")
          if (colonIndex > 0) {
            const key = keyVal.substring(0, colonIndex)
            const value = keyVal.substring(colonIndex + 1)
            const numValue = parseFloat(value)
            if (!isNaN(numValue)) {
              messageObj[key] = numValue
            }
          }
        }
      }

      if (!messages[messageName]) {
        messages[messageName] = []
      }

      ;(messages[messageName] as MessageObject[]).push(messageObj)

      const now = Date.now()
      if (now - lastUpdateTime > UPDATE_THROTTLE_MS) {
        lastUpdateTime = now
        const percent = Math.round((fileStream.bytesRead / fileSize) * 100)
        webContents.send("fla:log-parse-progress", { percent })
      }
    })

    rl.on("close", () => {
      webContents.send("fla:log-parse-progress", {
        percent: 100,
      })

      // Add format messages to messages for later digesting and return
      messages["format"] = formatMessages
      resolve(messages)
    })

    rl.on("error", (err: Error) => {
      console.error("Error reading log file:", err)
      reject(err)
    })
  })
}

function parseDataflashBinFile(
  filePath: string,
  webContents: WebContents,
): Messages {
  // Read file as ArrayBuffer
  const fileBuffer = fs.readFileSync(filePath)
  const fileArrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  )

  // Throttle progress updates to at most once every UPDATE_THROTTLE_MS
  let lastUpdateTime = 0
  const progressCallback = (percent: number) => {
    const now = Date.now()
    if (now - lastUpdateTime > UPDATE_THROTTLE_MS || percent === 100) {
      lastUpdateTime = now
      webContents.send("fla:log-parse-progress", { percent })
    }
  }

  const parser = new DataflashParser(null, progressCallback)
  const processedData = parser.processData(fileArrayBuffer)

  const parsedData: Messages = {
    format: getFormatMessages(processedData.types),
    aircraftType: getAircraftTypeFromMavType(parser.getMavType()),
    ...transformMessages(processedData.messages),
  }
  webContents.send("fla:log-parse-progress", {
    percent: 100,
  })
  return parsedData
}

async function determineLogFileType(filePath: string): Promise<LogType> {
  const ext = getFileExtension(filePath)

  const extensionToTypeMap: { [key: string]: LogType } = {
    bin: "dataflash_bin",
    log: "dataflash_log",
    ftlog: "fgcs_telemetry",
    // exclude txt from map as txt's are ambiguous
  }

  if (ext !== null && ext !== "txt" && ext in extensionToTypeMap) {
    return extensionToTypeMap[ext]
  } else {
    // Try to figure out the type of log file from the first line of the file
    const firstLine = await getFirstLine(filePath)

    if (
      firstLine === "FMT, 128, 89, FMT, BBnNZ, Type,Length,Name,Format,Columns"
    ) {
      return "dataflash_log"
    } else if (firstLine.includes("==START_TIME==")) {
      return "fgcs_telemetry"
    } else if (firstLine.match(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}/)) {
      // check if first line contains a string similar to "30/04/2024 13:08:13"
      return "mp_telemetry"
    } else {
      return null
    }
  }
}

// New function to get recent files
export function getRecentFiles(): string[] {
  return recentLogsManager.getRecentLogs()
}

// New function to clear recent files
export function clearRecentFiles(): void {
  recentLogsManager.clearRecentLogs()
}

async function getFirstLine(pathToFile: string): Promise<string> {
  // https://stackoverflow.com/a/60193465/23139916
  const readable = fs.createReadStream(pathToFile)
  const reader = readline.createInterface({ input: readable })
  const line = await new Promise<string>((resolve) => {
    reader.on("line", (line: string) => {
      reader.close()
      resolve(line)
    })
  })
  readable.close()
  return line
}

// function to process and save the log file data
function processAndSaveLogData(
  loadedLogMessages: Messages,
  logType: string,
): LogSummary {
  const aircraftType = loadedLogMessages.aircraftType

  const initialFilters = buildDefaultMessageFilters(loadedLogMessages)

  // Expand ESC messages
  const {
    updatedMessages: messagesWithESC,
    updatedFilters: filtersWithESC,
    updatedFormats: formatsWithESC,
  } = expandESCMessages(loadedLogMessages, initialFilters)

  // Expand BAT messages
  const {
    updatedMessages: expandedMessages,
    updatedFilters: finalFilters,
    updatedFormats: finalFormats,
  } = expandBATMessages(messagesWithESC, filtersWithESC, formatsWithESC)

  // Convert TimeUS to TimeUTC if GPS data is available
  let finalMessages = { ...expandedMessages }
  let gpsOffset: number | null = null
  let utcAvailable = false
  if (finalMessages.GPS && logType === "dataflash") {
    gpsOffset = calcGPSOffset(finalMessages)
    if (gpsOffset !== null) {
      finalMessages = convertTimeUStoUTC(finalMessages, gpsOffset)
      utcAvailable = true
    }
  }
  if (logType === "fgcs_telemetry") utcAvailable = true

  // 5. Calculate means on the final, fully-expanded data
  const means = calculateMeanValues(finalMessages)

  // 6. Process flight modes
  const flightModeMessages = processFlightModes(logType, finalMessages)

  logData = {
    ...finalMessages,
    format: finalFormats,
    aircraftType: aircraftType,
  } // Save the complete data with required properties
  defaultMessageFilters = sortObjectByKeys(finalFilters)

  // 8. Return the summary object
  return {
    formatMessages: finalFormats,
    utcAvailable,
    logEvents: (finalMessages["EV"] as MessageObject[]) || [],
    flightModeMessages,
    logType,
    messageFilters: defaultMessageFilters,
    messageMeans: means,
    aircraftType,
  }
}

export default async function openFile(
  event: { sender: WebContents },
  filePath: string | null,
): Promise<ParseResult> {
  if (filePath == null) {
    return { success: false, error: "No file path provided" }
  }

  try {
    // (nitpicking) Check if file is empty before proceeding
    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
      return { success: false, error: "Log file is empty." }
    }

    const logType = await determineLogFileType(filePath)

    if (logType === null) {
      return { success: false, error: "Unknown log file type" }
    }

    let messages: Messages | null = null

    if (logType === "dataflash_bin") {
      messages = parseDataflashBinFile(filePath, event.sender)
    } else {
      const fileStream = fs.createReadStream(filePath)
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      if (logType === "dataflash_log") {
        messages = await parseDataflashLogFile(
          rl,
          fileStream,
          stats.size,
          event.sender,
        )
      } else if (logType === "fgcs_telemetry") {
        messages = await parseFgcsTelemetryLogFile(
          rl,
          fileStream,
          stats.size,
          event.sender,
        )
      } else if (logType === "mp_telemetry") {
        // TODO: implement
        // messages = await parseMpTelemetryLogFile(fileLines, event.sender)
        return {
          success: false,
          error: "MP telemetry parsing not yet implemented",
        }
      }
    }

    if (messages !== null) {
      // returns a lightweight summary after processing
      const summary = processAndSaveLogData(messages, logType)

      // add recent file
      recentLogsManager.addRecentLog(filePath)
      return { success: true, summary }
    } else {
      return { success: false, error: "Failed to parse log file" }
    }
  } catch (err: unknown) {
    console.error("Error parsing log file:", err)
    const errorMessage =
      err instanceof Error ? err.message : "Unknown parsing error"
    return { success: false, error: errorMessage }
  }
}

// on-demand retrieval of messages
export async function getMessages(
  _event: unknown,
  requestedMessages: string[],
): Promise<Dataset[] | { success: false; error: string }> {
  // each requestedMessage should be of the form `${requestedMessageName}/${requestedFieldName}`
  // like ['ARM/ArmState', 'ARSP/Airspeed']

  // for large log files, we need to consider decimation.

  if (!logData) {
    console.error(
      "getMessages: logData is null or undefined. Unable to retrieve messages.",
    )
    return {
      success: false,
      error: "Log data not loaded. Cannot retrieve messages.",
    }
  }
  if (!Array.isArray(requestedMessages) || requestedMessages.length === 0) {
    return []
  }

  const formatMessages =
    (logData.format as { [key: string]: FormatMessage }) || {}
  const datasets: Dataset[] = []

  // Loop through the list of requested messages and transform each of them
  for (
    let messageIndex = 0;
    messageIndex < requestedMessages.length;
    messageIndex++
  ) {
    let label = requestedMessages[messageIndex]

    // format is supposed to be `${categoryName}/${fieldName}`
    label = label.trim()
    const slash = label.indexOf("/")
    const categoryName = label.slice(0, slash)
    const fieldName = label.slice(slash + 1)

    // Validate existence of requestedMessage in our log
    const fmt = formatMessages[categoryName]
    const hasField = fmt?.fields.includes(fieldName)

    const series = logData[categoryName] as MessageObject[]

    if (!hasField || !Array.isArray(series) || series.length === 0) {
      // Skip unknown or unavailable labels
      continue
    }

    // Get unit for this field from the format message
    let unit = "UNKNOWN"
    if (fmt?.units && Array.isArray(fmt.units)) {
      const fieldIndex = fmt.fields.indexOf(fieldName)
      if (fieldIndex !== -1 && fieldIndex < fmt.units.length) {
        unit = fmt.units[fieldIndex]
      }
    }

    const len = series.length
    // use typed arrays to reduce IPC serialization overhead
    // Time as Float64, values as Float32 for size efficiency
    const x = new Float64Array(len)
    const y = new Float32Array(len)

    for (let j = 0; j < len; j++) {
      const point = series[j]
      // making sure all the entries are numbers
      x[j] = typeof point.TimeUS === "number" ? point.TimeUS : 0
      y[j] = typeof point[fieldName] === "number" ? point[fieldName] : 0
    }

    datasets.push({
      label,
      yAxisID: unit,
      x,
      y,
    })
  }

  return datasets
}
