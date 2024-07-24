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
      },
    ],
  },
  {
    name: 'Attitude',
    filters: [
      {
        name: 'Desired Roll vs Achieved Roll',
        filters: { ATT: ['DesRoll', 'Roll'] },
      },
      {
        name: 'Desired Pitch vs Achieved Pitch',
        filters: { ATT: ['DesPitch', 'Pitch'] },
      },
      {
        name: 'Desired Yaw vs Achieved Yaw',
        filters: { ATT: ['DesYaw', 'Yaw'] },
      },
    ],
  },
  {
    name: 'Vibration',
    filters: [
      {
        name: 'Vibration XYZ',
        filters: { VIBE: ['VibeX', 'VibeY', 'VibeZ'] },
      },
    ],
  },
  {
    name: 'Battery',
    filters: [
      {
        name: 'Battery Voltage vs Current',
        filters: { BATT: ['Volt', 'Curr'] },
      },
    ],
  },
  {
    name: 'Control Tuning',
    filters: [
      {
        name: 'Desired Alt vs Achieved Alt vs Barometer Alt',
        filters: { CTUN: ['DAlt', 'Alt', 'BAlt'] },
      },
      {
        name: 'Desired Rangefinder Alt vs Achieved Rangefinder Alt vs Achieved Alt',
        filters: { CTUN: ['DSAlt', 'SAlt', 'Alt'] },
      },
      {
        name: 'Desired Climb Rate vs Achieved Climb Rate',
        filters: { CTUN: ['DCRt', 'CRt'] },
      },
      {
        name: 'Throttle Input vs Throttle Output',
        filters: { CTUN: ['ThI', 'ThO'] },
      },
    ],
  },
  {
    name: 'RC Inputs',
    filters: [
      {
        name: 'RC Inputs 1-4',
        filters: { RCIN: ['C1', 'C2', 'C3', 'C4'] },
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
