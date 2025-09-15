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
