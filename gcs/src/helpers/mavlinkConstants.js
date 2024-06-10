export const MAV_STATE = [
  'UNINIT',
  'BOOT',
  'CALIBRATING',
  'STANDBY',
  'ACTIVE',
  'CRITICAL',
  'EMERGENCY',
  'POWEROFF',
  'FLIGHT TERMINATION',
]

export const MAV_SEVERITY = [
  'EMERGENCY',
  'ALERT',
  'CRITICAL',
  'ERROR',
  'WARNING',
  'NOTICE',
  'INFO',
  'DEBUG',
]

export const PLANE_MODES_FLIGHT_MODE_MAP = {
  0: 'Manual',
  1: 'CIRCLE',
  2: 'STABILIZE',
  3: 'TRAINING',
  4: 'ACRO',
  5: 'FBWA',
  6: 'FBWB',
  7: 'CRUISE',
  8: 'AUTOTUNE',
  10: 'Auto',
  11: 'RTL',
  12: 'Loiter',
  13: 'TAKEOFF',
  14: 'AVOID_ADSB',
  15: 'Guided',
  17: 'QSTABILIZE',
  18: 'QHOVER',
  19: 'QLOITER',
  20: 'QLAND',
  21: 'QRTL',
  22: 'QAUTOTUNE',
  23: 'QACRO',
  24: 'THERMAL',
  25: 'Loiter to QLand',
}

export const COPTER_MODES_FLIGHT_MODE_MAP = {
  0: 'Stabilize',
  1: 'Acro',
  2: 'AltHold',
  3: 'Auto',
  4: 'Guided',
  5: 'Loiter',
  6: 'RTL',
  7: 'Circle',
  9: 'Land',
  11: 'Drift',
  13: 'Sport',
  14: 'Flip',
  15: 'AutoTune',
  16: 'PosHold',
  17: 'Brake',
  18: 'Throw',
  19: 'Avoid_ADSB',
  20: 'Guided_NoGPS',
  21: 'Smart_RTL',
  22: 'FlowHold',
  23: 'Follow',
  24: 'ZigZag',
  25: 'SystemID',
  26: 'Heli_Autorotate',
  27: 'UNKNOWN',
}

export const GPS_FIX_TYPES = [
  'NO GPS',
  'NO FIX',
  '2D FIX',
  '3D FIX',
  'DGPS',
  'RTK FLOAT',
  'RTK FIXED',
  'STATIC',
  'PPP',
]

export const MAV_AUTOPILOT_INVALID = 8

export const FRAME_TYPE_MAP_QUAD = {
  0: {motorOrder:[1,4,2,3],direction:['CW','CCW','CW','CCW'],ftype:'Plus'},
  1:{motorOrder:[3,1,4,2],direction:['CW','CCW','CW','CCW'],ftype:'X'},
  2:{motorOrder:[1,4,2,3],direction:['CCW','CW','CCW','CW'],ftype:'V'},
  3:{motorOrder:[1,4,2,3],direction:['CW','CCW','CW','CCW'],ftype:'H'},
  4:{motorOrder:[1,4,2,3],direction:['CCW','CW','CCW','CW'],ftype:'V_TAIL'},
  5:{motorOrder:[1,4,2,3],direction:['CCW','CW','CCW','CW'],ftype:'A_TAIL'},
  12:{motorOrder:[2,1,3,4],direction:['CCW','CW','CCW','CW'],ftype:'BetaFlightX'},
  13:{motorOrder:[1,4,3,2],direction:['CCW','CW','CCW','CW'],ftype:'DJIX'},
  14:{motorOrder:[1,2,3,4],direction:['CCW','CW','CCW','CW'],ftype:'CLockwiseX'},
  18:{motorOrder:[2,1,3,4],direction:['CW','CCW','CW','CCW'],ftype:'BetaFlightXReversed'},
}

export const FRAME_TYPE_MAP_HEX = {
  0:{motorOrder:[1,4,6,2,3,5],direction:['CW','CCW','CW','CCW','CW','CCW'],ftype:'Plus'},
  1:{motorOrder:[5,1,4,6,2,3],direction:['CCW','CW','CCW','CW','CCW','CW'],ftype:'X'},
  14:{motorOrder:[1,2,3,4,5,6],direction:['CCW','CW','CCW','CW','CCW','CW'],ftype:'ClockwiseX'},
}

export const FRAME_TYPE_MAP_OCTA = {
  0:{motorOrder:[1,3,8,4,2,6,7,5],direction:['CW','CCW','CW','CCW','CW','CCW','CW','CCW'],ftype:'Plus'},
  1:{motorOrder:[1,3,8,4,2,6,7,5],direction:['CW','CCW','CW','CCW','CW','CCW','CW','CCW'],ftype:'X'},
  2:{motorOrder:[7,6,2,4,8,3,1,5],direction:['CW','CCW','CW','CCW','CW','CCW','CW','CCW'],ftype:'V'},
  3:{motorOrder:[1,3,8,4,2,6,7,5],direction:['CW','CCW','CW','CCW','CW','CCW','CW','CCW'],ftype:'H'},
}

export const FRAME_TYPE_MAP_OCTA_QUAD = {
  0:{motorOrder:[1,6,4,7,3,8,2,5],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'Plus'},
  1:{motorOrder:[1,6,4,7,3,8,2,5],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'X'},
  2:{motorOrder:[1,6,4,7,3,8,2,5],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'V'},
  3:{motorOrder:[1,6,4,7,3,8,2,5],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'H'},
}

export const FRAME_TYPE_MAP_Y6 = {
  0:{motorOrder:[5,1,6,4,2,3],direction:['CW','CCW','CCW','CW','CW','CCW'],ftype:'X'},
  10:{motorOrder:[1,2,3,4,5,6],direction:['CW','CCW','CW','CCW','CW','CCW'],ftype:'Y6B'},
  11:{motorOrder:[2,5,1,4,3,6],direction:['CCW','CW','CCW','CW','CCW','CW'],ftype:'Y6F'},
}

export const FRAME_TYPE_MAP_DODECA_HEXA_COPTER = {
  0:{motorOrder:[1,2,3,4,5,6,7,8,9,10,11,12],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'Plus'},
  1:{motorOrder:[1,2,3,4,5,6,7,8,9,10,11,12],direction:['CCW','CW','CW','CCW','CCW','CW','CW','CCW','CCW','CW','CW','CCW'],ftype:'X'},
}

export const FRAME_CLASS_MAP ={
  0:{name:'Undefined',frametype:false,numberOfMotors:4},
  1:{name:'Quad',frametype:FRAME_TYPE_MAP_QUAD,numberOfMotors:4},
  2:{name:'Hexa',frametype: FRAME_TYPE_MAP_HEX,numberOfMotors:6},
  3:{name:'Octa',frametype:FRAME_TYPE_MAP_OCTA,numberOfMotors:8},
  4:{name:'OctaQuad',frametype:FRAME_TYPE_MAP_OCTA_QUAD,numberOfMotors:8},
  5:{name:'Y6',frametype:FRAME_TYPE_MAP_Y6,numberOfMotors:6},
  6:{name:'Heli',frametype:false,numberOfMotors:1},
  7:{name:'Tri',frametype:false,numberOfMotors:3},
  8:{name:'Single Copter',frametype:false,numberOfMotors:1},
  9:{name:'CoaxCopter',frametype:false,numberOfMotors:2},
  10:{name:'BiCopter',frametype:false,numberOfMotors:2},
  11:{name:'Heli_Dual',frametype:false,numberOfMotors:2},
  12:{name:'DodecaHexa',frametype:FRAME_TYPE_MAP_DODECA_HEXA_COPTER,numberOfMotors:12},
  13:{name:'HeliQuad',frametype:false,numberOfMotors:4},
  14:{name:'Deca',frametype:false,numberOfMotors:10},
}
