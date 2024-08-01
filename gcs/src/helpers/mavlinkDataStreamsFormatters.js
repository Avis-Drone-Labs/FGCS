function radToDeg(val) {
  return (val * 180) / Math.PI
}

export const mavlinkDataStreamFormatters = {
  'ATTITUDE.pitch': radToDeg,
  'ATTITUDE.roll': radToDeg,
  'ATTITUDE.yaw': radToDeg,
}
