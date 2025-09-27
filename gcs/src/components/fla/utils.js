import { ignoredKeys, ignoredMessages } from "./constants"

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

// Memoization cache for getUnit function
const unitCache = new Map()

export function clearUnitCache() {
  unitCache.clear()
}

export function getUnit(
  messageName,
  fieldName,
  formatMessages = {},
  units = {},
) {
  // Create cache key
  const cacheKey = `${messageName}/${fieldName}`
  if (unitCache.has(cacheKey)) {
    return unitCache.get(cacheKey)
  }

  // TODO: Find out why this is here
  let normalizedMessageName = messageName
  if (messageName.includes("ESC")) {
    normalizedMessageName = "ESC"
  }

  let result = "UNKNOWN"
  if (normalizedMessageName in formatMessages) {
    const formatMessage = formatMessages[normalizedMessageName]
    const fieldIndex = formatMessage.fields.indexOf(fieldName)
    if (fieldIndex !== -1 && formatMessage.units) {
      const unitId = formatMessage.units[fieldIndex]
      if (unitId in units) {
        result = units[unitId]
      }
    }
  }

  // Cache the result
  unitCache.set(cacheKey, result)
  return result
}

/**
 * Calculates the mean, min, and max values for each field in the loaded log messages.
 * Structure:
 * { "MESSAGE_TYPE/FIELD_NAME": { mean: value, min: value, max: value }, ... }
 */
export function calculateMeanValues(loadedLogMessages) {
  if (!loadedLogMessages) return null

  // Cache Set for O(1) lookups
  const ignoredMessagesSet = new Set(ignoredMessages)
  const means = {}

  // Process data directly without building intermediate arrays
  Object.keys(loadedLogMessages)
    .filter((key) => !ignoredMessagesSet.has(key))
    .forEach((key) => {
      const messageData = loadedLogMessages[key]
      if (!Array.isArray(messageData) || messageData.length === 0) return

      const fieldStats = {}

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

  // Cache keys and create Sets for O(1) lookups
  const messageKeys = Object.keys(loadedLogMessages)
  const formatKeys = Object.keys(loadedLogMessages["format"])
  const ignoredMessagesSet = new Set(ignoredMessages)
  const ignoredKeysSet = new Set(ignoredKeys)

  formatKeys
    // Only include messages that are within the log and are not ignored
    .filter((key) => messageKeys.includes(key) && !ignoredMessagesSet.has(key))
    .sort()
    .forEach((key) => {
      const fieldsState = {}
      // Set all field states to false if they're not ignored
      loadedLogMessages["format"][key].fields.forEach((field) => {
        if (!ignoredKeysSet.has(field)) {
          fieldsState[field] = false
        }
      })
      logMessageFilterDefaultState[key] = fieldsState
    })

  return logMessageFilterDefaultState
}

export function processFlightModes(result, loadedLogMessages) {
  let flightModes
  if (result.logType === "dataflash") {
    flightModes = loadedLogMessages.MODE
  } else if (result.logType === "fgcs_telemetry") {
    flightModes = getHeartbeatMessages(loadedLogMessages.HEARTBEAT)
  } else {
    flightModes = []
  }
  return flightModes
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
    const offset = utcTime.getTime() - messageObj.TimeUS / 1000
    return offset
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
  // This still takes some time for some reason
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
  const result = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})

  return result
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
