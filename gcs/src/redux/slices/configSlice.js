import { createSlice } from "@reduxjs/toolkit"

const configSlice = createSlice({
  name: "config",
  initialState: {
    gripperEnabled: false,
    flightModes: [
      "UNKNOWN",
      "UNKNOWN",
      "UNKNOWN",
      "UNKNOWN",
      "UNKNOWN",
      "UNKNOWN",
    ],
    flightModeChannel: "UNKNOWN",
    refreshingFlightModeData: false,
    pwmValue: 0
  },
  reducers: {
    setGripperEnabled: (state, action) => {
      if (action.payload === state.gripperEnabled) return
      state.gripperEnabled = action.payload
    },
    setFlightModesList: (state, action) => {
      if (action.payload === state.flightModes) return
      state.flightModes = action.payload
    },
    setFlightModeChannel: (state, action) => {
      if (action.payload === state.flightModeChannel) return
      state.flightModeChannel = action.payload
    },
    setRefreshingFlightModeData: (state, action) => {
      if (action.payload === state.refreshingFlightModeData) return
      state.refreshingFlightModeData = action.payload
    },
    setCurrentPwmValue: (state, action) => {
      if (action.payload === state.pwmValue) return
      state.pwmValue = action.payload
    },

    // Emits
    emitGripperEnabled: () => {},
    emitGetFlightModeConfig: () => {},
    emitSetFlightMode: () => {},
    emitRefreshFlightModeData: () => {},
    emitSetGripper: () => {}
  },
  selectors: {
    selectGripperEnabled: (state) => state.gripperEnabled,
    selectFlightModesList: (state) => state.flightModes,
    selectFlightModeChannel: (state) => state.flightModeChannel,
    selectRefreshingFlightModeData: (state) => state.refreshingFlightModeData,
    selectPwmValue: (state) => state.pwmValue
  },
})

export const {
  setGripperEnabled,
  setFlightModesList,
  setFlightModeChannel,
  setRefreshingFlightModeData,
  setCurrentPwmValue,
  emitGripperEnabled,
  emitGetFlightModeConfig,
  emitSetFlightMode,
  emitRefreshFlightModeData,
  emitSetGripper,
} = configSlice.actions

export const {
  selectGripperEnabled,
  selectFlightModesList,
  selectFlightModeChannel,
  selectRefreshingFlightModeData,
  selectPwmValue,
} = configSlice.selectors

export default configSlice
