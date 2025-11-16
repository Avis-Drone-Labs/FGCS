// Type definitions for fla-utils
import type {
  ExpandResult,
  FieldStats,
  FilterState,
  FormatMessage,
  LoadedLogMessages,
  MeanValues,
  MessageObject,
} from "../types/flaTypes"

const ignoredMessages: string[] = [
  "ERR",
  "EV",
  "MSG",
  "VER",
  "TIMESYNC",
  "PARAM_VALUE",
  "TSYN",
  "UNIT",
  "FILE",
  "FMTU",
  "FMT",
  "MULT",
  "PARM",
  "units",
  "format",
  "aircraftType",
]

const ignoredKeys: string[] = [
  "TimeUS",
  "function",
  "source",
  "result",
  "time_boot_ms",
]

export function gpsToUTC(
  gpsWeek: number,
  gms: number,
  leapSeconds: number = 18,
): Date {
  // GPS epoch starts at 1980-01-06 00:00:00 UTC
  const gpsEpoch = new Date(Date.UTC(1980, 0, 6))

  // Calculate total milliseconds since Unix epoch
  const totalMs =
    gpsEpoch.getTime() +
    gpsWeek * 604_800_000 + // Convert weeks to milliseconds
    gms - // Add GPS milliseconds
    leapSeconds * 1_000 // Subtract leap seconds

  return new Date(totalMs)
}

/**
 * Calculates the mean, min, and max values for each field in the loaded log messages.
 * Structure:
 * { "MESSAGE_TYPE/FIELD_NAME": { mean: value, min: value, max: value }, ... }
 */
export function calculateMeanValues(
  loadedLogMessages: LoadedLogMessages,
): MeanValues | null {
  if (!loadedLogMessages) return null

  // Cache Set for O(1) lookups
  const ignoredMessagesSet = new Set(ignoredMessages)
  const means: MeanValues = {}

  // Process data directly without building intermediate arrays
  Object.keys(loadedLogMessages)
    .filter((key) => !ignoredMessagesSet.has(key))
    .forEach((key) => {
      const messageData = loadedLogMessages[key]
      if (!Array.isArray(messageData) || messageData.length === 0) return

      const fieldStats: { [fieldKey: string]: FieldStats } = {}

      for (let i = 0; i < messageData.length; i++) {
        const message = messageData[i]

        // Process each field in the message
        for (const dataPointKey in message) {
          if (dataPointKey === "name") continue

          const dataPoint = message[dataPointKey]
          if (typeof dataPoint === "number") {
            const fieldKey = `${key}/${dataPointKey}`

            if (!fieldStats[fieldKey]) {
              // Initialize stats for this field
              fieldStats[fieldKey] = {
                min: dataPoint,
                max: dataPoint,
                sum: dataPoint,
                count: 1,
              }
            } else {
              const stats = fieldStats[fieldKey]
              if (dataPoint < stats.min) stats.min = dataPoint
              if (dataPoint > stats.max) stats.max = dataPoint
              stats.sum += dataPoint
              stats.count++
            }
          }
        }
      }

      // Calculate final means from accumulated stats
      Object.keys(fieldStats).forEach((fieldKey) => {
        const stats = fieldStats[fieldKey]
        means[fieldKey] = {
          mean: (stats.sum / stats.count).toFixed(2),
          max: stats.max.toFixed(2),
          min: stats.min.toFixed(2),
        }
      })
    })

  return means
}

/**
 * Builds a default message filter configuration object with all available fields set to false.
 * @example
 * // Returns something like:
 * // {
 * //   "AETR": { "Alt": false, "Elev": false, "Flag": false },
 * //   "AHR2": { "Roll": false, "Pitch": false, "Yaw": false }
 * // }
 */
export function buildDefaultMessageFilters(
  loadedLogMessages: LoadedLogMessages,
): FilterState {
  const logMessageFilterDefaultState: FilterState = {}

  // Cache keys and create Sets for O(1) lookups
  const messageKeys = Object.keys(loadedLogMessages)
  const formatData = loadedLogMessages["format"] as
    | { [key: string]: FormatMessage }
    | undefined
  const formatKeys = Object.keys(formatData || {})
  const ignoredMessagesSet = new Set(ignoredMessages)
  const ignoredKeysSet = new Set(ignoredKeys)

  formatKeys
    // Only include messages that are within the log and are not ignored
    .filter((key) => messageKeys.includes(key) && !ignoredMessagesSet.has(key))
    .sort()
    .forEach((key) => {
      const fieldsState: { [fieldName: string]: boolean } = {}
      // Set all field states to false if they're not ignored
      const formatMessage = formatData?.[key]
      if (formatMessage?.fields) {
        formatMessage.fields.forEach((field: string) => {
          if (!ignoredKeysSet.has(field)) {
            fieldsState[field] = false
          }
        })
      }
      logMessageFilterDefaultState[key] = fieldsState
    })

  return logMessageFilterDefaultState
}

export function processFlightModes(
  logType: string,
  loadedLogMessages: LoadedLogMessages,
): MessageObject[] {
  if (logType === "dataflash_log" || logType === "dataflash_bin") {
    const modeData = loadedLogMessages["MODE"]
    return Array.isArray(modeData) ? modeData : []
  } else if (logType === "fgcs_telemetry") {
    const heartbeatData = loadedLogMessages["HEARTBEAT"]
    return getHeartbeatMessages(
      Array.isArray(heartbeatData) ? heartbeatData : [],
    )
  } else {
    return []
  }
}

/**
 * For fgcs_telemetry logs:
 * Extracts heartbeat messages where mode changes occur
 */
export function getHeartbeatMessages(
  heartbeatMessages: MessageObject[],
): MessageObject[] {
  const modeMessages: MessageObject[] = []
  for (let i = 0; i < heartbeatMessages.length; i++) {
    const msg = heartbeatMessages[i]
    if (modeMessages.length === 0 || i === heartbeatMessages.length - 1) {
      modeMessages.push(msg)
    } else {
      const lastMsg = modeMessages[modeMessages.length - 1]
      if (lastMsg.custom_mode !== msg.custom_mode) {
        modeMessages.push(msg)
      }
    }
  }

  return modeMessages
}

/**
 * Calculates GPS offset for UTC conversion
 */
export function calcGPSOffset(
  loadedLogMessages: LoadedLogMessages,
): number | null {
  if (!loadedLogMessages) return null

  if (!("GPS" in loadedLogMessages) && !("GPS[0]" in loadedLogMessages)) {
    return null
  }

  const gpsData = loadedLogMessages["GPS"] || loadedLogMessages["GPS[0]"]

  if (!Array.isArray(gpsData) || !gpsData[0]) {
    return null
  }

  const messageObj = gpsData[0]
  if (messageObj.GWk !== undefined && messageObj.GMS !== undefined) {
    const utcTime = gpsToUTC(messageObj.GWk as number, messageObj.GMS as number)
    const offset = utcTime.getTime() - (messageObj.TimeUS as number) / 1000
    return offset
  }

  return null
}

/**
 * Converts TimeUS to UTC for all messages
 */
export function convertTimeUStoUTC(
  logMessages: LoadedLogMessages,
  gpsOffset: number,
): LoadedLogMessages {
  // This still takes some time for some reason
  const convertedMessages: LoadedLogMessages = { ...logMessages }

  Object.keys(convertedMessages)
    .filter((key) => key !== "format" && key !== "units")
    .forEach((key) => {
      const messages = convertedMessages[key]
      if (Array.isArray(messages)) {
        convertedMessages[key] = messages.map((message: MessageObject) => ({
          ...message,
          TimeUS: (message.TimeUS as number) / 1000 + gpsOffset,
        }))
      }
    })

  return convertedMessages
}

/**
 * Sorts object keys alphabetically
 */
export function sortObjectByKeys<T>(obj: { [key: string]: T }): {
  [key: string]: T
} {
  const result = Object.keys(obj)
    .sort()
    .reduce((acc: { [key: string]: T }, key: string) => {
      acc[key] = obj[key]
      return acc
    }, {})

  return result
}

/**
 * Expands ESC messages into separate arrays based on Instance
 */
export function expandESCMessages(
  logMessages: LoadedLogMessages,
  filterState: FilterState,
): ExpandResult {
  const escData = logMessages["ESC"]
  if (!Array.isArray(escData) || !escData.length) {
    const formatData = logMessages["format"]
    return {
      updatedMessages: logMessages,
      updatedFilters: filterState,
      updatedFormats:
        typeof formatData === "object" &&
        formatData !== null &&
        !Array.isArray(formatData)
          ? (formatData as { [key: string]: FormatMessage })
          : {},
    }
  }

  const updatedMessages: LoadedLogMessages = { ...logMessages }
  const updatedFilters: FilterState = { ...filterState }
  const formatData = logMessages["format"]
  const updatedFormats: { [key: string]: FormatMessage } =
    typeof formatData === "object" &&
    formatData !== null &&
    !Array.isArray(formatData)
      ? { ...(formatData as { [key: string]: FormatMessage }) }
      : {}

  escData.forEach((escMessage: MessageObject) => {
    const escName = `ESC${(escMessage["Instance"] as number) + 1}`
    const newEscData: MessageObject = {
      ...escMessage,
      name: escName,
    }

    if (!updatedMessages[escName]) {
      updatedMessages[escName] = []
      updatedFilters[escName] = { ...filterState["ESC"] }
      updatedFormats[escName] = {
        ...updatedFormats["ESC"],
        name: escName,
      }
    }

    const targetArray = updatedMessages[escName]
    if (Array.isArray(targetArray)) {
      targetArray.push(newEscData)
    }
  })

  delete updatedMessages["ESC"]
  delete updatedFilters["ESC"]
  delete updatedFormats["ESC"]

  // Update updatedMessages["format"] too
  updatedMessages["format"] = updatedFormats

  return { updatedMessages, updatedFilters, updatedFormats }
}

/**
 * Expands BAT messages into separate arrays based on Instance
 */
export function expandBATMessages(
  logMessages: LoadedLogMessages,
  filterState: FilterState,
  formatsWithESC: { [key: string]: FormatMessage },
): ExpandResult {
  const batData = logMessages["BAT"]
  if (!Array.isArray(batData)) {
    return {
      updatedMessages: logMessages,
      updatedFilters: filterState,
      updatedFormats: formatsWithESC,
    }
  }

  const updatedMessages: LoadedLogMessages = { ...logMessages }
  const updatedFilters: FilterState = { ...filterState }
  const updatedFormats: { [key: string]: FormatMessage } = { ...formatsWithESC }

  batData.forEach((battData: MessageObject) => {
    const instanceValue = battData["Instance"] ?? battData["Inst"]
    const battName = `BAT${((instanceValue as number) ?? 0) + 1}`

    if (!updatedMessages[battName]) {
      updatedMessages[battName] = []
      updatedFilters[battName] = { ...filterState["BAT"] }
      updatedFormats[battName] = {
        ...updatedFormats["BAT"],
        name: battName,
      }
    }

    const targetArray = updatedMessages[battName]
    if (Array.isArray(targetArray)) {
      targetArray.push({
        ...battData,
        name: battName,
      })
    }
  })

  delete updatedMessages["BAT"]
  delete updatedFormats["BAT"]
  delete updatedFilters["BAT"]

  // Update logMessages["format"] too
  updatedMessages["format"] = updatedFormats

  return { updatedMessages, updatedFilters, updatedFormats }
}

export function getFileExtension(filePath: string): string | null {
  const reFileExtension = /(?:\.([^.]+))?$/ // https://stackoverflow.com/a/680982
  const ext = reFileExtension.exec(filePath)?.[1]

  return ext ? ext.toLowerCase() : null
}
