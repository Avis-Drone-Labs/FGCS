// Shared types for FLA (Falcon Log Analyser)

// The other keys depend on the message type and they represent the individual
// fields of the message.
export interface MessageObject {
  name: string // e.g., "XKY1"
  TimeUS?: number // e.g., 1274721512
  Instance?: number
  Inst?: number
  [key: string]: string | number | undefined
}

// Format messages
export interface FormatMessage {
  name: string // e.g., "CTUN"
  type?: number // e.g., 0
  format: string // e.g., "QccccffffBffi"
  fields: string[] // e.g., ["TimeUS", "Roll", "Pitch", "RdO", "As", "SAs", "GU"]
  units?: string | string[] // e.g., "sdddd---n-n-n" or ["s", "deg", "deg", "deg", "deg", "UNKNOWN", ...]
  multipliers?: string | string[] // e.g., "FBBBB---000-B" or ["F", "B", "B", "B", "B", "UNKNOWN", ...]
}

// Dict with message name as key and array of message objects as value
// Other keys are format, units and aircraftType for log metadata
export interface LoadedLogMessages {
  [messageName: string]:
    | MessageObject[]
    | { [key: string]: FormatMessage }
    | { [key: string]: string }
    | string
    | null
}

// Dict with message name as key and array of message objects as value
// Other keys are format, units and aircraftType for log metadata
// Units are a mapping from single character to SI unit, e.g. { "k": "deg/s/s"}
// AircraftType is a string like "copter", "plane", "quadplane" or null
export interface Messages {
  // Metadata properties
  format: { [key: string]: FormatMessage }
  aircraftType: AircraftType

  // Message data - use index signature for dynamic message types
  [messageName: string]:
    | MessageObject[] // For dynamic message types like "CTUN", "ATT", etc.
    | { [key: string]: FormatMessage } // For the "format" property
    | AircraftType // For the "aircraftType" property
}

export type AircraftType = "copter" | "plane" | "quadplane" | null

export interface FilterState {
  [messageName: string]: { [fieldName: string]: boolean }
}

export interface FieldStats {
  min: number
  max: number
  sum: number
  count: number
}

export interface MeanValues {
  [fieldKey: string]: {
    mean: string
    max: string
    min: string
  }
}

export interface ExpandResult {
  updatedMessages: LoadedLogMessages
  updatedFilters: FilterState
  updatedFormats: { [key: string]: FormatMessage }
}

export interface ParseResult {
  success: boolean
  error?: string
  summary?: LogSummary
}

export interface ParamObject {
  name: string
  value: string | number
}

export interface MapPositionDataObject {
  lat: number
  lon: number
}

export interface MapPositionData {
  gps?: MapPositionDataObject[] | undefined
  gps2?: MapPositionDataObject[] | undefined
  pos?: MapPositionDataObject[] | undefined
}

export interface LogSummary {
  formatMessages: { [key: string]: FormatMessage }
  utcAvailable: boolean
  logEvents: MessageObject[]
  flightModeMessages: MessageObject[]
  logType: string
  messageFilters: Record<string, unknown>
  messageMeans: Record<
    string,
    { mean: string; max: string; min: string }
  > | null
  aircraftType: AircraftType
  firmwareVersion: string | null
  params: ParamObject[] | null
  mapPositionData: MapPositionData | null
}

export interface Dataset {
  label: string
  yAxisID: string
  x: Float64Array
  y: Float32Array
}

export type LogType =
  | "dataflash_bin"
  | "dataflash_log"
  | "fgcs_telemetry"
  | "mp_telemetry"
  | null

export interface RecentLog {
  path: string
  timestamp: number
}
