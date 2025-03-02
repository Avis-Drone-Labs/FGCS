function radToDeg(val) {
  return (val * 180) / Math.PI
}

// Convert coordinates from mavlink into gps coordinates
export function intToCoord(val) {
  return val * 1e-7
}

export const dataFormatters = {
  "ATTITUDE.pitch": radToDeg,
  "ATTITUDE.roll": radToDeg,
  "ATTITUDE.yaw": radToDeg,
}
