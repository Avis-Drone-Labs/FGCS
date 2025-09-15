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
