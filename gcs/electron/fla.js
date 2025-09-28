/*
This file contains the logic for parsing different types of log files on the main electron process.
*/

import fs from "fs"
import createRecentLogsManager from "../settings/recentLogManager"

const recentLogsManager = createRecentLogsManager()

async function parseDataflashLogFile(fileData, webContents) {
  // https://ardupilot.org/copter/docs/logmessages.html
  // https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_Logger

  const stringTypes = new Set(["n", "N", "Z", "M"])

  const formatMessages = {}
  const messages = {}
  const units = {}
  const numberOfLines = fileData.length

  let aircraftType = null
  const PROGRESS_INTERVAL = 25000 // Reduce progress update frequency
  const CHUNK_SIZE = 10000 // Process in chunks to prevent blocking

  for (let idx = 0; idx < numberOfLines; idx++) {
    const line = fileData[idx]

    // Skip empty lines early
    if (!line || line.length < 3) continue

    // Optimized splitting - avoid trim on every element
    const splitLineData = line.split(",")
    const messageName = splitLineData[0].trim()
    if (messageName === "FMT") {
      // Message defining the format of messages in this file
      const definedMessageType = parseInt(splitLineData[1])
      const definedMessageLength = parseInt(splitLineData[2])
      const definedMessageName = splitLineData[3].trim()
      const definedMessageFormat = splitLineData[4].trim()
      const fields = splitLineData.slice(5).map((f) => f.trim())

      formatMessages[definedMessageName] = {
        length: definedMessageLength,
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
          formatMessage.multiplier = messageMultiplier
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

        const messageObj = {
          name: messageName,
          type: formatMessage.type,
        }

        const fields = formatMessage.fields
        const format = formatMessage.format
        const fieldsLength = fields.length

        for (let i = 0; i < fieldsLength && i < splitLineData.length - 1; i++) {
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

        messages[messageName].push(messageObj)
      }
    }

    if (idx % PROGRESS_INTERVAL === 0) {
      const percent = Math.round((idx / numberOfLines) * 100)
      webContents.send("fla:log-parse-progress", { percent })
    }

    // Yield control to prevent blocking for very large files
    if (idx % CHUNK_SIZE === 0 && idx > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  webContents.send("fla:log-parse-progress", {
    percent: 100,
  })

  // Add format messages to messages for later digesting and return
  messages["format"] = formatMessages
  messages["units"] = units
  messages["aircraftType"] = aircraftType
  return messages
}

async function parseFgcsTelemetryLogFile(fileData, webContents) {
  const formatMessages = {}
  const messages = {}
  const numberOfLines = fileData.length
  const CHUNK_SIZE = 10000
  const PROGRESS_INTERVAL = 25000

  if (numberOfLines < 2) {
    return null
  }

  for (let idx = 0; idx < numberOfLines; idx++) {
    const line = fileData[idx]
    if (!line || line.length < 5 || line.includes("==")) {
      continue
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
      continue
    }

    const messageData = splitLineData.slice(2)

    // Get field names and cache format
    if (!formatMessages[messageName]) {
      const fields = []
      for (let i = 0; i < messageData.length; i++) {
        const keyVal = messageData[i]?.trim()
        if (keyVal) {
          const colonIndex = keyVal.indexOf(":")
          if (colonIndex > 0) {
            fields.push(keyVal.substring(0, colonIndex))
          }
        }
      }
      formatMessages[messageName] = { fields }
    }

    const messageObj = {
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

    messages[messageName].push(messageObj)

    if (idx % PROGRESS_INTERVAL === 0) {
      const percent = Math.round((idx / numberOfLines) * 100)
      webContents.send("fla:log-parse-progress", { percent })
    }

    // Yield control for large files
    if (idx % CHUNK_SIZE === 0 && idx > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  webContents.send("fla:log-parse-progress", {
    percent: 100,
  })

  // Add format messages to messages for later digesting and return
  messages["format"] = formatMessages
  return messages
}

function determineLogFileType(filePath, firstLine) {
  const reFileExtension = /(?:\.([^.]+))?$/ // https://stackoverflow.com/a/680982
  const ext = reFileExtension.exec(filePath)[1]

  const extensionToTypeMap = {
    log: "dataflash",
    ftlog: "fgcs_telemetry",
    // exclude txt from map as txt's are ambiguous
  }

  if (ext !== undefined && ext !== "txt" && ext in extensionToTypeMap) {
    return extensionToTypeMap[ext]
  } else {
    // Try to figure out the type of log file from the first line of the file
    if (
      firstLine === "FMT, 128, 89, FMT, BBnNZ, Type,Length,Name,Format,Columns"
    ) {
      return "dataflash"
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
export function getRecentFiles() {
  return recentLogsManager.getRecentLogs()
}

// New function to clear recent files
export function clearRecentFiles() {
  recentLogsManager.clearRecentLogs()
}

export default async function openFile(event, filePath) {
  if (filePath == null) {
    return { success: false, error: "No file path provided" }
  }

  try {
    const fileData = fs.readFileSync(filePath, "utf8")
    const fileLines = fileData.trim().split("\n")

    const logType = determineLogFileType(filePath, fileLines[0])

    if (logType === null) {
      return { success: false, error: "Unknown log file type" }
    }

    let messages = null

    if (logType === "dataflash") {
      messages = await parseDataflashLogFile(fileLines, event.sender)
    } else if (logType === "fgcs_telemetry") {
      messages = await parseFgcsTelemetryLogFile(fileLines, event.sender)
    } else if (logType === "mp_telemetry") {
      // TODO: implement
      // messages = await parseMpTelemetryLogFile(fileLines, event.sender)
      return {
        success: false,
        error: "MP telemetry parsing not yet implemented",
      }
    } else {
      return { success: false, error: "Unknown log file type" }
    }

    if (messages !== null) {
      // add recent file
      recentLogsManager.addRecentLog(filePath)
      return {
        success: true,
        messages,
        logType,
      }
    } else {
      return { success: false, error: "Failed to parse log file" }
    }
  } catch (err) {
    console.error("Error parsing log file:", err)
    return { success: false, error: err.message || "Unknown parsing error" }
  }
}
