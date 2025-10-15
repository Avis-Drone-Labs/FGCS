export function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
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
