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
    pwmValue: 0,
    frameTypeOrder: null,
    frameTypeDirection: null,
    frameTypeName: null,
    frameClass: null,
    numberOfMotors: 4,
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
    setFrameTypeOrder: (state, action) => {
      if (action.payload === state.frameTypeOrder) return
      state.frameTypeOrder = action.payload
    },
    setFrameTypeDirection: (state, action) => {
      if (action.payload === state.frameTypeDirection) return
      state.frameTypeDirection = action.payload 
    },
    setFrameTypeName: (state, action) => {
      if (action.payload === state.frameTypeName) return
      state.frameTypeName = action.payload 
    },
    setFrameClass: (state, action) => {
      if (action.payload === state.frameClass) return
      state.frameClass = action.payload
    },
    setNumberOfMotors: (state, action) => {
      if (action.payload === state.numberOfMotors) return
      state.numberOfMotors = action.payload 
    },

    // Emits
    emitGripperEnabled: () => {},
    emitGetFlightModeConfig: () => {},
    emitSetFlightMode: () => {},
    emitRefreshFlightModeData: () => {},
    emitSetGripper: () => {},
    emitGetFrameConfig: () => {},
    emitTestOneMotor: () => {},
    emitTestMotorSequence: () => {},
    emitTestAllMotors: () => {},
  },
  selectors: {
    selectGripperEnabled: (state) => state.gripperEnabled,
    selectFlightModesList: (state) => state.flightModes,
    selectFlightModeChannel: (state) => state.flightModeChannel,
    selectRefreshingFlightModeData: (state) => state.refreshingFlightModeData,
    selectPwmValue: (state) => state.pwmValue,
    selectFrameTypeOrder: (state) => state.frameTypeOrder,
    selectFrameTypeDirection: (state) => state.frameTypeDirection,
    selectFrameTypeName: (state) => state.frameTypeName,
    selectFrameClass: (state) => state.frameClass,
    selectNumberOfMotors: (state) => state.numberOfMotors,
  },
})

export const {
  setGripperEnabled,
  setFlightModesList,
  setFlightModeChannel,
  setRefreshingFlightModeData,
  setCurrentPwmValue,
  setFrameTypeOrder,
  setFrameTypeDirection,
  setFrameTypeName,
  setFrameClass,
  setNumberOfMotors,

  // Emitters
  emitGripperEnabled,
  emitGetFlightModeConfig,
  emitSetFlightMode,
  emitRefreshFlightModeData,
  emitSetGripper,
  emitGetFrameConfig,
  emitTestOneMotor,
  emitTestMotorSequence,
  emitTestAllMotors
} = configSlice.actions

export const {
  selectGripperEnabled,
  selectFlightModesList,
  selectFlightModeChannel,
  selectRefreshingFlightModeData,
  selectPwmValue,
  selectFrameTypeOrder,
  selectFrameTypeDirection,
  selectFrameTypeName,
  selectFrameClass,
  selectNumberOfMotors,
} = configSlice.selectors

export default configSlice
