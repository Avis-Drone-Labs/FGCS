export const MAV_STATE = [
  "UNINIT",
  "BOOT",
  "CALIBRATING",
  "STANDBY",
  "ACTIVE",
  "CRITICAL",
  "EMERGENCY",
  "POWEROFF",
  "FLIGHT TERMINATION",
]

export const MAV_SEVERITY = [
  "EMERGENCY",
  "ALERT",
  "CRITICAL",
  "ERROR",
  "WARNING",
  "NOTICE",
  "INFO",
  "DEBUG",
]

export const PLANE_MODES_FLIGHT_MODE_MAP = {
  0: "Manual",
  1: "CIRCLE",
  2: "STABILIZE",
  3: "TRAINING",
  4: "ACRO",
  5: "FBWA",
  6: "FBWB",
  7: "CRUISE",
  8: "AUTOTUNE",
  10: "Auto",
  11: "RTL",
  12: "Loiter",
  13: "TAKEOFF",
  14: "AVOID_ADSB",
  15: "Guided",
  17: "QSTABILIZE",
  18: "QHOVER",
  19: "QLOITER",
  20: "QLAND",
  21: "QRTL",
  22: "QAUTOTUNE",
  23: "QACRO",
  24: "THERMAL",
  25: "Loiter to QLand",
}

export const COPTER_MODES_FLIGHT_MODE_MAP = {
  0: "Stabilize",
  1: "Acro",
  2: "AltHold",
  3: "Auto",
  4: "Guided",
  5: "Loiter",
  6: "RTL",
  7: "Circle",
  9: "Land",
  11: "Drift",
  13: "Sport",
  14: "Flip",
  15: "AutoTune",
  16: "PosHold",
  17: "Brake",
  18: "Throw",
  19: "Avoid_ADSB",
  20: "Guided_NoGPS",
  21: "Smart_RTL",
  22: "FlowHold",
  23: "Follow",
  24: "ZigZag",
  25: "SystemID",
  26: "Heli_Autorotate",
  27: "UNKNOWN",
}

export function getFlightModeMap(aircraftType) {
  if (aircraftType === "Plane") {
    return PLANE_MODES_FLIGHT_MODE_MAP
  } else if (aircraftType === "Copter") {
    return COPTER_MODES_FLIGHT_MODE_MAP
  }
  return {}
}

export const GPS_FIX_TYPES = [
  "NO GPS",
  "NO FIX",
  "2D FIX",
  "3D FIX",
  "DGPS",
  "RTK FLOAT",
  "RTK FIXED",
  "STATIC",
  "PPP",
]

export const MAV_AUTOPILOT_INVALID = 8

export const FRAME_TYPE_MAP_QUAD = {
  0: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "Plus",
  },
  1: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "X",
  },
  2: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "V",
  },
  3: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CW", "CCW", "CW", "CCW"],
    frametypename: "H",
  },
  4: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "V_TAIL",
  },
  5: {
    motorOrder: [1, 4, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "A_TAIL",
  },
  12: {
    motorOrder: [2, 1, 3, 4],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "BetaFlightX",
  },
  13: {
    motorOrder: [1, 4, 3, 2],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "DJIX",
  },
  14: {
    motorOrder: [1, 2, 3, 4],
    direction: ["CCW", "CW", "CCW", "CW"],
    frametypename: "CLockwiseX",
  },
  18: {
    motorOrder: [2, 1, 3, 4],
    direction: ["CW", "CCW", "CW", "CCW"],
    frametypename: "BetaFlightXReversed",
  },
}

export const FRAME_TYPE_MAP_HEX = {
  0: {
    motorOrder: [1, 4, 6, 2, 3, 5],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "Plus",
  },
  1: {
    motorOrder: [5, 1, 4, 6, 2, 3],
    direction: ["CCW", "CW", "CCW", "CW", "CCW", "CW"],
    frametypename: "X",
  },
  14: {
    motorOrder: [1, 2, 3, 4, 5, 6],
    direction: ["CCW", "CW", "CCW", "CW", "CCW", "CW"],
    frametypename: "ClockwiseX",
  },
}

export const FRAME_TYPE_MAP_OCTA = {
  0: {
    motorOrder: [1, 3, 8, 4, 2, 6, 7, 5],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "Plus",
  },
  1: {
    motorOrder: [1, 3, 8, 4, 2, 6, 7, 5],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "X",
  },
  2: {
    motorOrder: [7, 6, 2, 4, 8, 3, 1, 5],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "V",
  },
  3: {
    motorOrder: [1, 3, 8, 4, 2, 6, 7, 5],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "H",
  },
}

export const FRAME_TYPE_MAP_OCTA_QUAD = {
  0: {
    motorOrder: [1, 6, 4, 7, 3, 8, 2, 5],
    direction: ["CCW", "CW", "CW", "CCW", "CCW", "CW", "CW", "CCW"],
    frametypename: "Plus",
  },
  1: {
    motorOrder: [1, 6, 4, 7, 3, 8, 2, 5],
    direction: ["CCW", "CW", "CW", "CCW", "CCW", "CW", "CW", "CCW"],
    frametypename: "X",
  },
  2: {
    motorOrder: [1, 6, 4, 7, 3, 8, 2, 5],
    direction: ["CCW", "CW", "CW", "CCW", "CCW", "CW", "CW", "CCW"],
    frametypename: "V",
  },
  3: {
    motorOrder: [1, 6, 4, 7, 3, 8, 2, 5],
    direction: ["CW", "CCW", "CCW", "CW", "CW", "CCW", "CCW", "CW"],
    frametypename: "H",
  },
}

export const FRAME_TYPE_MAP_Y6 = {
  0: {
    motorOrder: [5, 1, 6, 4, 2, 3],
    direction: ["CW", "CCW", "CCW", "CW", "CW", "CCW"],
    frametypename: "Y6A",
  },
  10: {
    motorOrder: [1, 2, 3, 4, 5, 6],
    direction: ["CW", "CCW", "CW", "CCW", "CW", "CCW"],
    frametypename: "Y6B",
  },
  11: {
    motorOrder: [2, 5, 1, 4, 3, 6],
    direction: ["CCW", "CW", "CCW", "CW", "CCW", "CW"],
    frametypename: "Y6F",
  },
}

export const FRAME_TYPE_MAP_DODECA_HEXA_COPTER = {
  0: {
    motorOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    direction: [
      "CCW",
      "CW",
      "CW",
      "CCW",
      "CCW",
      "CW",
      "CW",
      "CCW",
      "CCW",
      "CW",
      "CW",
      "CCW",
    ],
    frametypename: "Plus",
  },
  1: {
    motorOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    direction: [
      "CCW",
      "CW",
      "CW",
      "CCW",
      "CCW",
      "CW",
      "CW",
      "CCW",
      "CCW",
      "CW",
      "CW",
      "CCW",
    ],
    frametypename: "X",
  },
}

export const FRAME_CLASS_MAP = {
  0: { name: "Undefined", frametype: false, numberOfMotors: 4 },
  1: { name: "Quad", frametype: FRAME_TYPE_MAP_QUAD, numberOfMotors: 4 },
  2: { name: "Hexa", frametype: FRAME_TYPE_MAP_HEX, numberOfMotors: 6 },
  3: { name: "Octa", frametype: FRAME_TYPE_MAP_OCTA, numberOfMotors: 8 },
  4: {
    name: "OctaQuad",
    frametype: FRAME_TYPE_MAP_OCTA_QUAD,
    numberOfMotors: 8,
  },
  5: { name: "Y6", frametype: FRAME_TYPE_MAP_Y6, numberOfMotors: 6 },
  6: { name: "Heli", frametype: false, numberOfMotors: 1 },
  7: { name: "Tri", frametype: false, numberOfMotors: 3 },
  8: { name: "Single Copter", frametype: false, numberOfMotors: 1 },
  9: { name: "CoaxCopter", frametype: false, numberOfMotors: 2 },
  10: { name: "BiCopter", frametype: false, numberOfMotors: 2 },
  11: { name: "Heli_Dual", frametype: false, numberOfMotors: 2 },
  12: {
    name: "DodecaHexa",
    frametype: FRAME_TYPE_MAP_DODECA_HEXA_COPTER,
    numberOfMotors: 12,
  },
  13: { name: "HeliQuad", frametype: false, numberOfMotors: 4 },
  14: { name: "Deca", frametype: false, numberOfMotors: 10 },
}

export const MOTOR_LETTER_LABELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
]

export const MISSION_STATES = {
  0: "UNKNOWN",
  1: "NO MISSION",
  2: "NOT STARTED",
  3: "ACTIVE",
  4: "PAUSED",
  5: "COMPLETED",
}

// List of mission item commands to not display on the map
// due to lack of GPS coordinates
export const FILTER_MISSION_ITEM_COMMANDS_LIST = {
  MAV_CMD_NAV_RETURN_TO_LAUNCH: 20,
  MAV_CMD_NAV_TAKEOFF: 22,
  MAV_CMD_NAV_LAND_LOCAL: 23,
  MAV_CMD_NAV_TAKEOFF_LOCAL: 24,
  MAV_CMD_NAV_ALTITUDE_WAIT: 83,
  MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT: 30,
  MAV_CMD_NAV_DELAY: 93,
  MAV_CMD_DO_AUX_FUNCTION: 218,
  MAV_CMD_DO_CHANGE_SPEED: 178,
  MAV_CMD_DO_ENGINE_CONTROL: 223,
  MAV_CMD_DO_VTOL_TRANSITION: 3000,
  MAV_CMD_DO_SET_SERVO: 183,
  MAV_CMD_DO_SET_RELAY: 181,
  MAV_CMD_DO_REPEAT_SERVO: 184,
  MAV_CMD_DO_REPEAT_RELAY: 182,
  MAV_CMD_DO_DIGICAM_CONFIGURE: 202,
  MAV_CMD_DO_DIGICAM_CONTROL: 203,
  MAV_CMD_DO_SET_CAM_TRIGG_DIST: 206,
  MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW: 1000,
  MAV_CMD_DO_JUMP: 177,
  MAV_CMD_JUMP_TAG: 600,
  MAV_CMD_DO_JUMP_TAG: 601,
  MAV_CMD_DO_MOUNT_CONTROL: 205,
  MAV_CMD_DO_INVERTED_FLIGHT: 210,
  MAV_CMD_DO_FENCE_ENABLE: 207,
  MAV_CMD_DO_AUTOTUNE_ENABLE: 212,
  MAV_CMD_DO_SET_RESUME_REPEAT_DIST: 215,
  MAV_CMD_STORAGE_FORMAT: 526,
  MAV_CMD_NAV_GUIDED_ENABLE: 92,
  MAV_CMD_COMPONENT_ARM_DISARM: 400,
  MAV_CMD_CONDITION_DELAY: 112,
  MAV_CMD_CONDITION_CHANGE_ALT: 113,
  MAV_CMD_CONDITION_DISTANCE: 114,
  MAV_CMD_CONDITION_YAW: 115,
  MAV_CMD_DO_PARACHUTE: 208,
  MAV_CMD_DO_GRIPPER: 211,
  MAV_CMD_DO_GUIDED_LIMITS: 222,
  MAV_CMD_DO_WINCH: 42600,
  MAV_CMD_DO_FOLLOW: 32,
  MAV_CMD_DO_FOLLOW_REPOSITION: 33,
}

export const PLANE_MISSION_ITEM_COMMANDS_LIST = {
  16: "MAV_CMD_NAV_WAYPOINT",
  20: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
  22: "MAV_CMD_NAV_TAKEOFF",
  21: "MAV_CMD_NAV_LAND",
  17: "MAV_CMD_NAV_LOITER_UNLIM",
  18: "MAV_CMD_NAV_LOITER_TURNS",
  19: "MAV_CMD_NAV_LOITER_TIME",
  83: "MAV_CMD_NAV_ALTITUDE_WAIT",
  31: "MAV_CMD_NAV_LOITER_TO_ALT",
  30: "MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT",
  84: "MAV_CMD_NAV_VTOL_TAKEOFF",
  85: "MAV_CMD_NAV_VTOL_LAND",
  93: "MAV_CMD_NAV_DELAY",
  94: "MAV_CMD_NAV_PAYLOAD_PLACE",
  112: "MAV_CMD_CONDITION_DELAY",
  114: "MAV_CMD_CONDITION_DISTANCE",
  218: "MAV_CMD_DO_AUX_FUNCTION",
  178: "MAV_CMD_DO_CHANGE_SPEED",
  223: "MAV_CMD_DO_ENGINE_CONTROL",
  3000: "MAV_CMD_DO_VTOL_TRANSITION",
  179: "MAV_CMD_DO_SET_HOME",
  183: "MAV_CMD_DO_SET_SERVO",
  181: "MAV_CMD_DO_SET_RELAY",
  184: "MAV_CMD_DO_REPEAT_SERVO",
  182: "MAV_CMD_DO_REPEAT_RELAY",
  202: "MAV_CMD_DO_DIGICAM_CONFIGURE", // (Camera enabled only)
  203: "MAV_CMD_DO_DIGICAM_CONTROL", // (Camera enabled only)
  206: "MAV_CMD_DO_SET_CAM_TRIGG_DIST", // (Camera enabled only)
  201: "MAV_CMD_DO_SET_ROI", // (Gimbal/mount enabled only)
  10000: "MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW", // (Gimbal/mount enabled only)
  177: "MAV_CMD_DO_JUMP",
  600: "MAV_CMD_JUMP_TAG",
  601: "MAV_CMD_DO_JUMP_TAG",
  205: "MAV_CMD_DO_MOUNT_CONTROL",
  210: "MAV_CMD_DO_INVERTED_FLIGHT",
  189: "MAV_CMD_DO_LAND_START",
  207: "MAV_CMD_DO_FENCE_ENABLE",
  212: "MAV_CMD_DO_AUTOTUNE_ENABLE",
  215: "MAV_CMD_DO_SET_RESUME_REPEAT_DIST",
  526: "MAV_CMD_STORAGE_FORMAT",
}

export const COPTER_MISSION_ITEM_COMMANDS_LIST = {
  16: "MAV_CMD_NAV_WAYPOINT",
  20: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
  22: "MAV_CMD_NAV_TAKEOFF",
  21: "MAV_CMD_NAV_LAND",
  17: "MAV_CMD_NAV_LOITER_UNLIM",
  18: "MAV_CMD_NAV_LOITER_TURNS",
  19: "MAV_CMD_NAV_LOITER_TIME",
  82: "MAV_CMD_NAV_SPLINE_WAYPOINT",
  92: "MAV_CMD_NAV_GUIDED_ENABLE", // (NAV_GUIDED only)
  93: "MAV_CMD_NAV_DELAY",
  94: "MAV_CMD_NAV_PAYLOAD_PLACE",
  177: "MAV_CMD_DO_JUMP",
  600: "MAV_CMD_JUMP_TAG",
  601: "MAV_CMD_DO_JUMP_TAG",
  300: "MAV_CMD_MISSION_START",
  400: "MAV_CMD_COMPONENT_ARM_DISARM",
  112: "MAV_CMD_CONDITION_DELAY",
  114: "MAV_CMD_CONDITION_DISTANCE",
  115: "MAV_CMD_CONDITION_YAW",
  218: "MAV_CMD_DO_AUX_FUNCTION",
  178: "MAV_CMD_DO_CHANGE_SPEED",
  179: "MAV_CMD_DO_SET_HOME",
  183: "MAV_CMD_DO_SET_SERVO",
  181: "MAV_CMD_DO_SET_RELAY",
  184: "MAV_CMD_DO_REPEAT_SERVO",
  182: "MAV_CMD_DO_REPEAT_RELAY",
  202: "MAV_CMD_DO_DIGICAM_CONFIGURE", // (Camera enabled only)
  203: "MAV_CMD_DO_DIGICAM_CONTROL", // (Camera enabled only)
  206: "MAV_CMD_DO_SET_CAM_TRIGG_DIST", // (Camera enabled only)
  201: "MAV_CMD_DO_SET_ROI",
  205: "MAV_CMD_DO_MOUNT_CONTROL", // (Gimbal/mount enabled only)
  10000: "MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW", // (Gimbal/mount enabled only)
  208: "MAV_CMD_DO_PARACHUTE", // (Parachute enabled only)
  211: "MAV_CMD_DO_GRIPPER",
  222: "MAV_CMD_DO_GUIDED_LIMITS", // (NAV_GUIDED only)
  215: "MAV_CMD_DO_SET_RESUME_REPEAT_DIST",
  207: "MAV_CMD_DO_FENCE_ENABLE",
  42600: "MAV_CMD_DO_WINCH",
  526: "MAV_CMD_STORAGE_FORMAT",
}

export const FENCE_ITEM_COMMANDS_LIST = {
  5001: "MAV_CMD_NAV_FENCE_POLYGON_VERTEX_INCLUSION",
  5002: "MAV_CMD_NAV_FENCE_POLYGON_VERTEX_EXCLUSION",
  5003: "MAV_CMD_NAV_FENCE_CIRCLE_INCLUSION",
  5004: "MAV_CMD_NAV_FENCE_CIRCLE_EXCLUSION",
}

export const MAV_FRAME_LIST = {
  0: "MAV_FRAME_GLOBAL",
  1: "MAV_FRAME_LOCAL_NED",
  2: "MAV_FRAME_MISSION",
  3: "MAV_FRAME_GLOBAL_RELATIVE_ALT",
  4: "MAV_FRAME_LOCAL_ENU",
  5: "MAV_FRAME_GLOBAL_INT",
  6: "MAV_FRAME_GLOBAL_RELATIVE_ALT_INT",
  7: "MAV_FRAME_LOCAL_OFFSET_NED",
  8: "MAV_FRAME_BODY_NED",
  9: "MAV_FRAME_BODY_OFFSET_NED",
  10: "MAV_FRAME_GLOBAL_TERRAIN_ALT",
  11: "MAV_FRAME_GLOBAL_TERRAIN_ALT_INT",
  12: "MAV_FRAME_BODY_FRD",
  21: "MAV_FRAME_LOCAL_FRD",
  22: "MAV_FRAME_LOCAL_FLU",
  23: "MAV_FRAME_ENUM_END",
}

export const EKF_STATUS_FLAGS = {
  1: "EKF_ATTITUDE",
  2: "EKF_VELOCITY_HORIZ",
  4: "EKF_VELOCITY_VERT",
  8: "EKF_POS_HORIZ_REL",
  16: "EKF_POS_HORIZ_ABS",
  32: "EKF_POS_VERT_ABS",
  64: "EKF_POS_VERT_AGL",
  128: "EKF_CONST_POS_MODE",
  256: "EKF_PRED_POS_HORIZ_REL",
  512: "EKF_PRED_POS_HORIZ_ABS",
  1024: "EKF_UNINITIALIZED",
  32768: "EKF_GPS_GLITCHING",
}

export function getActiveEKFFlags(statusValue) {
  const activeFlags = []

  for (const [flag, name] of Object.entries(EKF_STATUS_FLAGS)) {
    const flagValue = parseInt(flag)
    if (statusValue & flagValue) {
      activeFlags.push(name)
    }
  }

  return activeFlags
}

export const COMMONLY_USED_MISSION_TABLE_LABELS = ["WAYPOINT", "RETURN_TO_LAUNCH", "TAKEOFF", "LOITER_UNLIM", "LAND"]

export const EKF_STATUS_WARNING_LEVEL = 0.5
export const EKF_STATUS_DANGER_LEVEL = 0.8
export const VIBE_STATUS_WARNING_LEVEL = 30
export const VIBE_STATUS_DANGER_LEVEL = 60
