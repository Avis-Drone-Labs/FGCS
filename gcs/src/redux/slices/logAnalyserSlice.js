import { createSlice } from "@reduxjs/toolkit"

const logAnalyserSlice = createSlice({
  name: "logAnalyser",
  initialState: {
    file: null,
    units: {},
    formatMessages: {},
    logMessages: null,
    utcAvailable: false,
    logEvents: null,
    flightModeMessages: [],
    logType: "dataflash",
    messageFilters: null,
    messageMeans: {},
    chartData: { datasets: [] },
    customColors: {},
    colorIndex: 0,
    aircraftType: null,
    canSavePreset: false,
  },
  reducers: {
    setFile: (state, action) => {
      state.file = action.payload
    },
    setUnits: (state, action) => {
      state.units = action.payload
    },
    setFormatMessages: (state, action) => {
      state.formatMessages = action.payload
    },
    setLogMessages: (state, action) => {
      state.logMessages = action.payload
    },
    setUtcAvailable: (state, action) => {
      state.utcAvailable = action.payload
    },
    setLogEvents: (state, action) => {
      state.logEvents = action.payload
    },
    setFlightModeMessages: (state, action) => {
      state.flightModeMessages = action.payload
    },
    setLogType: (state, action) => {
      state.logType = action.payload
    },
    setMessageFilters: (state, action) => {
      state.messageFilters = action.payload
    },
    setMessageMeans: (state, action) => {
      state.messageMeans = action.payload
    },
    setCustomColors: (state, action) => {
      state.customColors = action.payload
    },
    setColorIndex: (state, action) => {
      state.colorIndex = action.payload
    },
    setAircraftType: (state, action) => {
      state.aircraftType = action.payload
    },
    setCanSavePreset: (state, action) => {
      state.canSavePreset = action.payload
    },
  },
  selectors: {
    selectFile: (state) => state.file,
    selectUnits: (state) => state.units,
    selectFormatMessages: (state) => state.formatMessages,
    selectLogMessages: (state) => state.logMessages,
    selectLogEvents: (state) => state.logEvents,
    selectFlightModeMessages: (state) => state.flightModeMessages,
    selectLogType: (state) => state.logType,
    selectUtcAvailable: (state) => state.utcAvailable,
    selectMessageFilters: (state) => state.messageFilters,
    selectMessageMeans: (state) => state.messageMeans,
    selectCustomColors: (state) => state.customColors,
    selectColorIndex: (state) => state.colorIndex,
    selectAircraftType: (state) => state.aircraftType,
    selectCanSavePreset: (state) => state.canSavePreset,
  },
})

export const {
  setFile,
  setUnits,
  setFormatMessages,
  setLogMessages,
  setUtcAvailable,
  setLogEvents,
  setFlightModeMessages,
  setLogType,
  setMessageFilters,
  setMessageMeans,
  setCustomColors,
  setColorIndex,
  setAircraftType,
  setCanSavePreset,
} = logAnalyserSlice.actions

export const {
  selectFile,
  selectUnits,
  selectFormatMessages,
  selectLogMessages,
  selectLogEvents,
  selectFlightModeMessages,
  selectLogType,
  selectUtcAvailable,
  selectMessageFilters,
  selectMessageMeans,
  selectCustomColors,
  selectColorIndex,
  selectAircraftType,
  selectCanSavePreset,
} = logAnalyserSlice.selectors

export default logAnalyserSlice
