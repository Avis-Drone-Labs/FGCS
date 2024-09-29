import { createSlice } from '@reduxjs/toolkit'

const logAnalyserSlice = createSlice({
  name: 'logAnalyser',
  initialState: {
    file: null,
    units: {},
    formatMessages: {},
    logMessages: null,
    logEvents: null,
    flightModeMessages: [],
    logType: 'dastaflash',
    messageFilters: null,
    messageMeans: {},
    chartData: { datasets: [] },
    customColors: {},
    colorIndex: 0,
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
    setChartData: (state, action) => {
      state.chartData = action.payload
    },
    setCustomColors: (state, action) => {
      state.customColors = action.payload
    },
    setColorIndex: (state, action) => {
      state.colorIndex = action.payload
    },
  },
})

export const {
  setFile,
  setUnits,
  setFormatMessages,
  setLogMessages,
  setLogEvents,
  setFlightModeMessages,
  setLogType,
  setMessageFilters,
  setMessageMeans,
  setChartData,
  setCustomColors,
  setColorIndex,
} = logAnalyserSlice.actions

export default logAnalyserSlice.reducer
