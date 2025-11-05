import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"

export const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export const ignoredMessages = [
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
export const ignoredKeys = [
  "TimeUS",
  "function",
  "source",
  "result",
  "time_boot_ms",
]

export const colorPalette = [
  "#36a2eb",
  "#ff6383",
  "#fe9e40",
  "#4ade80",
  "#ffcd57",
  "#4cbfc0",
  "#9966ff",
  "#c8cbce",
]

export const colorInputSwatch = [
  "#f5f5f5",
  "#868e96",
  "#fa5252",
  "#e64980",
  "#be4bdb",
  "#7950f2",
  "#4c6ef5",
  "#228be6",
  "#15aabf",
  "#12b886",
  "#40c057",
  "#82c91e",
  "#fab005",
  "#fd7e14",
]

// Fixed list of message labels to preload for FLA
export const PRELOAD_LABELS = {
  dataflash: [
    // Attitude
    "ATT/DesRoll",
    "ATT/Roll",
    "ATT/DesPitch",
    "ATT/Pitch",
    "ATT/DesYaw",
    "ATT/Yaw",

    // Speed
    "GPS/Spd",
    "ARSP/Airspeed",

    // Vibration
    "VIBE/VibeX",
    "VIBE/VibeY",
    "VIBE/VibeZ",

    // Battery
    "BAT1/Volt",
    "BAT1/Curr",

    // Control tuning (copter/plane)
    "CTUN/DAlt",
    "CTUN/Alt",
    "CTUN/BAlt",
    "CTUN/DCRt",
    "CTUN/CRt",
    "CTUN/ThI",
    "CTUN/ThO",

    // Control tuning (quadplane)
    "QTUN/DAlt",
    "QTUN/Alt",
    "QTUN/BAlt",
    "QTUN/DCRt",
    "QTUN/CRt",
    "QTUN/ThI",
    "QTUN/ThO",

    // RC Inputs (first four)
    "RCIN/C1",
    "RCIN/C2",
    "RCIN/C3",
    "RCIN/C4",
  ],

  fgcs_telemetry: [
    // Attitude
    "ATTITUDE/roll",
    "ATTITUDE/pitch",

    // Speed
    "VFR_HUD/groundspeed",
    "VFR_HUD/airspeed",

    // Vibration
    "VIBRATION/vibration_x",
    "VIBRATION/vibration_y",
    "VIBRATION/vibration_z",

    // RC Inputs (first four)
    "RC_CHANNELS/chan1_raw",
    "RC_CHANNELS/chan2_raw",
    "RC_CHANNELS/chan3_raw",
    "RC_CHANNELS/chan4_raw",
  ],
}
