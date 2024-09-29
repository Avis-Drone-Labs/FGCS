/*
This file contains all the preset categories for FLA depending on the type of log file opened.
*/

const dataflashPresetCategories = [
  {
    name: 'Speed',
    filters: [
      {
        name: 'Ground Speed vs Air Speed',
        filters: { GPS: ['Spd'], ARSP: ['Airspeed'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
    ],
  },
  {
    name: 'Attitude',
    filters: [
      {
        name: 'Desired Roll vs Achieved Roll',
        filters: { ATT: ['DesRoll', 'Roll'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
      {
        name: 'Desired Pitch vs Achieved Pitch',
        filters: { ATT: ['DesPitch', 'Pitch'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
      {
        name: 'Desired Yaw vs Achieved Yaw',
        filters: { ATT: ['DesYaw', 'Yaw'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
    ],
  },
  {
    name: 'Vibration',
    filters: [
      {
        name: 'Vibration XYZ',
        filters: { VIBE: ['VibeX', 'VibeY', 'VibeZ'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
    ],
  },
  {
    name: 'Battery',
    filters: [
      {
        name: 'Battery Voltage vs Current',
        filters: { BATT: ['Volt', 'Curr'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
    ],
  },
  {
    name: 'Control Tuning',
    filters: [
      {
        name: 'Desired Alt vs Achieved Alt vs Barometer Alt',
        filters: { CTUN: ['DAlt', 'Alt', 'BAlt'] },
        aircraftType: ['copter', 'plane'],
      },
      {
        name: 'Desired Rangefinder Alt vs Achieved Rangefinder Alt vs Achieved Alt',
        filters: { CTUN: ['DSAlt', 'SAlt', 'Alt'] },
        aircraftType: ['copter', 'plane'],
      },
      {
        name: 'Desired Climb Rate vs Achieved Climb Rate',
        filters: { CTUN: ['DCRt', 'CRt'] },
        aircraftType: ['copter', 'plane'],
      },
      {
        name: 'Throttle Input vs Throttle Output',
        filters: { CTUN: ['ThI', 'ThO'] },
        aircraftType: ['copter', 'plane'],
      },
      {
        name: 'Desired Alt vs Achieved Alt vs Barometer Alt',
        filters: { QTUN: ['DAlt', 'Alt', 'BAlt'] },
        aircraftType: ['quadplane'],
      },
      {
        name: 'Desired Rangefinder Alt vs Achieved Rangefinder Alt vs Achieved Alt',
        filters: { QTUN: ['DSAlt', 'SAlt', 'Alt'] },
        aircraftType: ['quadplane'],
      },
      {
        name: 'Desired Climb Rate vs Achieved Climb Rate',
        filters: { QTUN: ['DCRt', 'CRt'] },
        aircraftType: ['quadplane'],
      },
      {
        name: 'Throttle Input vs Throttle Output',
        filters: { QTUN: ['ThI', 'ThO'] },
        aircraftType: ['quadplane'],
      },
    ],
  },
  {
    name: 'RC Inputs',
    filters: [
      {
        name: 'RC Inputs 1-4',
        filters: { RCIN: ['C1', 'C2', 'C3', 'C4'] },
        aircraftType: ['copter', 'plane', 'quadplane'],
      },
    ],
  },
]

const fgcsTelemetryPresetCategories = [
  {
    name: 'Speed',
    filters: [
      {
        name: 'Ground Speed vs Air Speed',
        filters: { VFR_HUD: ['groundspeed', 'airspeed'] },
      },
    ],
  },
  {
    name: 'Attitude',
    filters: [
      {
        name: 'Roll vs Pitch',
        filters: { ATTITUDE: ['roll', 'pitch'] },
      },
    ],
  },
  {
    name: 'Vibration',
    filters: [
      {
        name: 'Vibration XYZ',
        filters: { VIBRATION: ['vibration_x', 'vibration_y', 'vibration_z'] },
      },
      {
        name: 'Clipping',
        filters: { VIBRATION: ['clipping_0', 'clipping_1', 'clipping_2'] },
      },
    ],
  },
  {
    name: 'RC Inputs',
    filters: [
      {
        name: 'RC Inputs 1-4',
        filters: {
          RC_CHANNELS: ['chan1_raw', 'chan2_raw', 'chan3_raw', 'chan4_raw'],
        },
      },
    ],
  },
]

export const presetCategories = {
  dataflash: dataflashPresetCategories,
  fgcs_telemetry: fgcsTelemetryPresetCategories,
}
