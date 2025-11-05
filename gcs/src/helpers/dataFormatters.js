import { MAV_FRAME_LIST } from "./mavlinkConstants"

function radToDeg(val) {
  return (val * 180) / Math.PI
}

// Convert coordinates from mavlink into gps coordinates
export function intToCoord(val) {
  return val * 1e-7
}

export function coordToInt(val) {
  return parseInt(val * 1e7)
}

export const dataFormatters = {
  "ATTITUDE.pitch": radToDeg,
  "ATTITUDE.roll": radToDeg,
  "ATTITUDE.yaw": radToDeg,
}

export function getPositionFrameName(frameId) {
  if (frameId === undefined || frameId === null) {
    return "UNKNOWN"
  }

  var frameName = MAV_FRAME_LIST[frameId]

  if (frameName.startsWith("MAV_FRAME_")) {
    frameName = frameName.replace("MAV_FRAME_", "")
  }

  return frameName || "UNKNOWN"
}

export function centiDegToDeg(val) {
  if (val === null || val === undefined) {
    return null
  }
  try {
    if (parseInt(val) === 65535) {
      return null
    }
    return parseFloat(val) / 100.0
  } catch (e) {
    return null
  }
}
