/* eslint-disable @typescript-eslint/no-explicit-any */
const ignoredMessages = [
  "ERR",
  "EV",
  "MSG",
  "VER",
  "TIMESYNC",
  "PARAM_VALUE",
  "units",
  "format",
  "aircraftType",
]
const ignoredKeys = ["TimeUS", "function", "source", "result", "time_boot_ms"]

export function gpsToUTC(gpsWeek: number, gms: number, leapSeconds = 18) {
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
export function calculateMeanValues(loadedLogMessages: { [x: string]: any }) {
  if (!loadedLogMessages) return null

  // Cache Set for O(1) lookups
  const ignoredMessagesSet = new Set(ignoredMessages)
  const means: { [key: string]: { mean: string; max: string; min: string } } =
    {}

  // Process data directly without building intermediate arrays
  Object.keys(loadedLogMessages)
    .filter((key) => !ignoredMessagesSet.has(key))
    .forEach((key) => {
      const messageData = loadedLogMessages[key]
      if (!Array.isArray(messageData) || messageData.length === 0) return

      const fieldStats: {
        [key: string]: { min: number; max: number; sum: number; count: number }
      } = {}

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
export function buildDefaultMessageFilters(loadedLogMessages: {
  [x: string]: any
}) {
  const logMessageFilterDefaultState: {
    [key: string]: { [field: string]: boolean }
  } = {}

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
      const fieldsState: { [field: string]: boolean } = {}
      // Set all field states to false if they're not ignored
      loadedLogMessages["format"][key].fields.forEach((field: string) => {
        if (!ignoredKeysSet.has(field)) {
          fieldsState[field] = false
        }
      })
      logMessageFilterDefaultState[key] = fieldsState
    })

  return logMessageFilterDefaultState
}

export function processFlightModes(
  logType: string,
  loadedLogMessages: { [x: string]: any },
) {
  if (logType === "dataflash") {
    return loadedLogMessages.MODE
  } else if (logType === "fgcs_telemetry") {
    return getHeartbeatMessages(loadedLogMessages.HEARTBEAT)
  } else {
    return []
  }
}

/**
 * For fgcs_telemetry logs:
 * Extracts heartbeat messages where mode changes occur
 */
export function getHeartbeatMessages(heartbeatMessages: any[]) {
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
 */
export function calcGPSOffset(loadedLogMessages: { [x: string]: any[] }) {
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
 */
export function convertTimeUStoUTC(logMessages: any, gpsOffset: number) {
  // This still takes some time for some reason
  const convertedMessages = { ...logMessages }

  Object.keys(convertedMessages)
    .filter((key) => key !== "format" && key !== "units")
    .forEach((key) => {
      convertedMessages[key] = convertedMessages[key].map(
        (message: { [key: string]: any; TimeUS: number }) => ({
          ...message,
          TimeUS: message.TimeUS / 1000 + gpsOffset,
        }),
      )
    })

  return convertedMessages
}

/**
 * Sorts object keys alphabetically
 */
export function sortObjectByKeys(obj: { [x: string]: any }) {
  const result = Object.keys(obj)
    .sort()
    .reduce(
      (acc: { [key: string]: any }, key: string) => {
        acc[key] = obj[key]
        return acc
      },
      {} as { [key: string]: any },
    )

  return result
}

/**
 * Expands ESC messages into separate arrays based on Instance
 */
export function expandESCMessages(
  logMessages: { [key: string]: any },
  filterState: { [key: string]: any },
) {
  const escData = logMessages["ESC"]
  if (!escData?.length) {
    return {
      updatedMessages: logMessages,
      updatedFilters: filterState,
      updatedFormats: logMessages["format"],
    }
  }

  const updatedMessages = { ...logMessages }
  const updatedFilters = { ...filterState }
  const updatedFormats = { ...logMessages["format"] }

  escData.forEach((escMessage: { [x: string]: number }) => {
    const escName = `ESC${escMessage["Instance"] + 1}`
    const newEscData = {
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

    updatedMessages[escName].push(newEscData)
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
  logMessages: { [key: string]: any },
  filterState: { [key: string]: any },
  formatsWithESC: { [key: string]: any },
) {
  if (!logMessages["BAT"]) {
    return {
      updatedMessages: logMessages,
      updatedFilters: filterState,
      updatedFormats: formatsWithESC,
    }
  }

  const updatedMessages = { ...logMessages }
  const updatedFilters = { ...filterState }
  const updatedFormats = { ...formatsWithESC }

  logMessages["BAT"].forEach((battData: { [x: string]: any }) => {
    const instanceValue = battData["Instance"] ?? battData["Inst"]
    const battName = `BAT${(instanceValue ?? 0) + 1}`

    if (!updatedMessages[battName]) {
      updatedMessages[battName] = []
      updatedFilters[battName] = { ...filterState["BAT"] }
      updatedFormats[battName] = {
        ...updatedFormats["BAT"],
        name: battName,
      }
    }

    updatedMessages[battName].push({
      ...battData,
      name: battName,
    })
  })

  delete updatedMessages["BAT"]
  delete updatedFormats["BAT"]
  delete updatedFilters["BAT"]

  // Update logMessages["format"] too
  updatedMessages["format"] = updatedFormats

  return { updatedMessages, updatedFilters, updatedFormats }
}

// Memoization cache for getUnit function
const unitCache = new Map()

export function clearUnitCache() {
  unitCache.clear()
}

export function getUnit(
  messageName: string,
  fieldName: any,
  formatMessages: { [key: string]: any },
  units: { [key: string]: any },
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
