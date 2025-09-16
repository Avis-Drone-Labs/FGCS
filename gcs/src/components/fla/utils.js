import { ignoredMessages, ignoredKeys } from "./constants"

/**
 * Converts a hex color string to an RGBA color string.
 * @param {string} hex - The hex color string.
 * @param {number} alpha - The alpha value (0-1).
 * @returns {string} - The RGBA color string.
 */
export function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Converts GPS time to UTC time.
 * @param {number} gpsWeek - The GPS week number.
 * @param {number} gms - The GPS milliseconds.
 * @param {number} leapSeconds - The number of leap seconds to account for.
 * @returns {Date} - The corresponding UTC date.
 */
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
 * @param {string} messageName - The name of the message.
 * @param {string} fieldName - The name of the field within the message.
 * @param {Object} formatMessages - An object containing message format definitions.
 * @param {Object} units - An object mapping unit IDs to unit names.
 * @returns {string} - The unit name for the specified field, or "UNKNOWN" if not found.
 */
export function getUnit(
  messageName,
  fieldName,
  formatMessages = {},
  units = {},
) {
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
 * @param {*} loadedLogMessages
 * @returns An object containing mean, min, and max for each field in the log messages.
 * 
 * Structure: 
 * { "MESSAGE_TYPE/FIELD_NAME": { mean: value, min: value, max: value }, ... }
 */
export function calculateMeanValues(loadedLogMessages) {
  if (loadedLogMessages === null) return null
  // Loop over all fields and precalculate min, max, mean
  let rawValues = {}
  if (loadedLogMessages !== null) {
    // Putting all raw data into a list
    Object.keys(loadedLogMessages).forEach((key) => {
      if (!ignoredMessages.includes(key)) {
        let messageData = loadedLogMessages[key]
        let messageDataMeans = {}

        messageData.forEach((message) => {
          Object.keys(message).forEach((dataPointKey) => {
            let dataPoint = message[dataPointKey]
            if (dataPointKey != dataPoint && dataPointKey != "name") {
              if (messageDataMeans[dataPointKey] == undefined) {
                messageDataMeans[dataPointKey] = [dataPoint]
              } else {
                messageDataMeans[dataPointKey].push(dataPoint)
              }
            }
          })
        })

        rawValues[key] = messageDataMeans
      }
    })

    // Looping over each list and finding min, max, mean
    let means = {}
    Object.keys(rawValues).forEach((key) => {
      means[key] = {}
      let messageData = rawValues[key]
      Object.keys(messageData).forEach((messageKey) => {
        let messageValues = messageData[messageKey]
        let min = messageValues.reduce(
          (x, y) => Math.min(x, y),
          Number.NEGATIVE_INFINITY,
        )
        let max = messageValues.reduce(
          (x, y) => Math.max(x, y),
          Number.NEGATIVE_INFINITY,
        )
        let mean =
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
}

/**
 * Builds a default message filter configuration object with all fields set to false.
 *
 * Creates a hierarchical filter structure where each valid message type contains
 * all of its available fields initialized to false (filtered out). This provides
 * a starting state where all message fields are hidden by default, allowing users
 * to selectively enable the fields they want to display.
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
    .sort()
    .forEach((key) => {
      if (
        Object.keys(loadedLogMessages).includes(key) &&
        !ignoredMessages.includes(key)
      ) {
        const fieldsState = {}

        // Set all field states to false if they're not ignored
        loadedLogMessages["format"][key].fields.forEach((field) => {
          if (!ignoredKeys.includes(field)) {
            fieldsState[field] = false
          }
        })
        logMessageFilterDefaultState[key] = fieldsState
      }
    })
  return logMessageFilterDefaultState
}

/**
 * Processes flight mode messages based on log type
 * @param {Object} result - Result from file loading
 * @param {Object} loadedLogMessages - Loaded log messages
 * @returns {Array} Flight mode messages
 */
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
  
  Object.keys(convertedMessages).forEach((key) => {
    if (key !== "format" && key !== "units") {
      convertedMessages[key] = convertedMessages[key].map((message) => ({
        ...message,
        TimeUS: message.TimeUS / 1000 + gpsOffset,
      }))
    }
  })
  
  return convertedMessages
}

/**
 * Sorts object keys alphabetically
 * @param {Object} obj - Object to sort
 * @returns {Object} New object with sorted keys
 */
export function sortObjectByKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}