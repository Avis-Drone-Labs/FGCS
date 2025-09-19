import { ignoredMessages, ignoredKeys } from "./constants"

export function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

export function gpsToUTC(gpsWeek, gms, leapSeconds = 18) {
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
 * Retrieves the unit for a given message field.
 */
export function getUnit(
  messageName,
  fieldName,
  formatMessages = {},
  units = {},
) {
  // TODO: Find out why this is here
  if (messageName.includes("ESC")) {
    messageName = "ESC"
  }

  if (messageName in formatMessages) {
    const formatMessage = formatMessages[messageName]
    const fieldIndex = formatMessage.fields.indexOf(fieldName)
    if (fieldIndex !== -1 && formatMessage.units) {
      const unitId = formatMessage.units[fieldIndex]
      if (unitId in units) {
        return units[unitId]
      }
    }
  }
  return "UNKNOWN"
}

/**
 * Calculates the mean, min, and max values for each field in the loaded log messages.
 * Structure:
 * { "MESSAGE_TYPE/FIELD_NAME": { mean: value, min: value, max: value }, ... }
 */
export function calculateMeanValues(loadedLogMessages) {
  if (!loadedLogMessages) return null
  // Loop over all fields and precalculate min, max, mean
  const rawValues = {}
  // Putting all raw data into a list
  Object.keys(loadedLogMessages)
    .filter((key) => !ignoredMessages.includes(key))
    .forEach((key) => {
      const messageData = loadedLogMessages[key]
      const messageDataMeans = {}

      messageData.forEach((message) => {
        Object.keys(message)
          .filter((dataPointKey) => dataPointKey != "name")
          .forEach((dataPointKey) => {
            const dataPoint = message[dataPointKey]
            if (messageDataMeans[dataPointKey] === undefined) {
              messageDataMeans[dataPointKey] = [dataPoint]
            } else {
              messageDataMeans[dataPointKey].push(dataPoint)
            }
          })
      })

      rawValues[key] = messageDataMeans
    })

  // Looping over each list and finding min, max, mean
  const means = {}
  Object.keys(rawValues).forEach((key) => {
    means[key] = {}
    const messageData = rawValues[key]
    Object.keys(messageData).forEach((messageKey) => {
      const messageValues = messageData[messageKey]
      // Safeguard for empty arrays
      if (messageValues.length === 0) return

      const min = Math.min(...messageValues)
      const max = Math.max(...messageValues)
      const mean =
        messageValues.reduce((acc, curr) => acc + curr, 0) /
        messageValues.length

      means[`${key}/${messageKey}`] = {
        mean: mean.toFixed(2),
        max: max.toFixed(2),
        min: min.toFixed(2),
      }
    })
  })
  return means
}

/**
 * Builds a default message filter configuration object with all fields set to false.
 * @example
 * // Returns something like:
 * // {
 * //   "AETR": { "Alt": false, "Elev": false, "Flag": false },
 * //   "AHR2": { "Roll": false, "Pitch": false, "Yaw": false }
 * // }
 */
export function buildDefaultMessageFilters(loadedLogMessages) {
  const logMessageFilterDefaultState = {}
  Object.keys(loadedLogMessages["format"])
    // Only include messages that are within the log and are not ignored
    .filter(
      (key) =>
        Object.keys(loadedLogMessages).includes(key) &&
        !ignoredMessages.includes(key),
    )
    .sort()
    .forEach((key) => {
      const fieldsState = {}
      // Set all field states to false if they're not ignored
      loadedLogMessages["format"][key].fields.forEach((field) => {
        if (!ignoredKeys.includes(field)) {
          fieldsState[field] = false
        }
      })
      logMessageFilterDefaultState[key] = fieldsState
    })
  return logMessageFilterDefaultState
}

export function processFlightModes(result, loadedLogMessages) {
  if (result.logType === "dataflash") {
    return loadedLogMessages.MODE
  } else if (result.logType === "fgcs_telemetry") {
    return getHeartbeatMessages(loadedLogMessages.HEARTBEAT)
  }
  return []
}

/**
 * For fgcs_telemetry logs:
 * Extracts heartbeat messages where mode changes occur
 * @param {Array} heartbeatMessages - Array of heartbeat messages
 * @returns {Array} Filtered heartbeat messages showing mode changes
 */
export function getHeartbeatMessages(heartbeatMessages) {
  const modeMessages = []
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
 * @param {Object} loadedLogMessages - Log messages containing GPS data
 * @returns {number|null} GPS offset in milliseconds, or null if unavailable
 */
export function calcGPSOffset(loadedLogMessages) {
  if (!loadedLogMessages["GPS"] || !loadedLogMessages["GPS"][0]) {
    return null
  }

  const messageObj = loadedLogMessages["GPS"][0]
  if (messageObj.GWk !== undefined && messageObj.GMS !== undefined) {
    const utcTime = gpsToUTC(messageObj.GWk, messageObj.GMS)
    return utcTime.getTime() - messageObj.TimeUS / 1000
  }
  return null
}

/**
 * Converts TimeUS to UTC for all messages
 * @param {Object} logMessages - Messages to convert
 * @param {number} gpsOffset - GPS offset in milliseconds
 * @returns {Object} Messages with TimeUS converted to UTC
 */
export function convertTimeUStoUTC(logMessages, gpsOffset) {
  const convertedMessages = { ...logMessages }

  Object.keys(convertedMessages)
    .filter((key) => key !== "format" && key !== "units")
    .forEach((key) => {
      convertedMessages[key] = convertedMessages[key].map((message) => ({
        ...message,
        TimeUS: message.TimeUS / 1000 + gpsOffset,
      }))
    })

  return convertedMessages
}

/**
 * Sorts object keys alphabetically
 */
export function sortObjectByKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

export function readableBytes(bytes) {
  if (bytes === 0) return "0"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const sizes = ["B", "KB", "MB", "GB"]

  return (
    (Math.round((bytes / Math.pow(1024, i)) * 100) / 100).toFixed(2) +
    "" +
    sizes[i]
  )
}
