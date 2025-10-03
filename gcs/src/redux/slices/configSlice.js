import { createSlice } from "@reduxjs/toolkit"

const configSlice = createSlice({
  name: "config",
  initialState: {
    getGripperEnabled: false,
    gripperConfig: {},
    refreshingGripperConfigData: false,
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
    showMotorTestWarningModal: true,
    radioChannels: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
    },
    radioChannelsConfig: {},
  },
  reducers: {
    setGetGripperEnabled: (state, action) => {
      if (action.payload === state.getGripperEnabled) return
      state.getGripperEnabled = action.payload
    },
    setGripperConfig: (state, action) => {
      if (action.payload === state.gripperConfig) return
      state.gripperConfig = action.payload
    },
    updateGripperConfigParam: (state, action) => {
      const { param_id, value } = action.payload
      if (state.gripperConfig[param_id] === value) return
      state.gripperConfig[param_id] = value
    },
    setRefreshingGripperConfigData: (state, action) => {
      if (action.payload === state.refreshingGripperConfigData) return
      state.refreshingGripperConfigData = action.payload
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
    setShowMotorTestWarningModal: (state, action) => {
      if (action.payload === state.showMotorTestWarningModal) return
      state.showMotorTestWarningModal = action.payload
    },
    setRadioChannels: (state, action) => {
      if (action.payload === state.radioChannels) return
      state.radioChannels = action.payload
    },
    setChannelsConfig: (state, action) => {
      if (action.payload === state.radioChannelsConfig) return
      state.radioChannelsConfig = action.payload
    },

    // Emits
    emitGetGripperEnabled: () => {},
    emitGetGripperConfig: () => {},
    emitSetGripperConfigParam: () => {},
    emitGetFlightModeConfig: () => {},
    emitSetFlightMode: () => {},
    emitRefreshFlightModeData: () => {},
    emitSetGripper: () => {},
    emitGetFrameConfig: () => {},
    emitTestOneMotor: () => {},
    emitTestMotorSequence: () => {},
    emitTestAllMotors: () => {},
    emitGetRcConfig: () => {},
  },
  selectors: {
    selectGetGripperEnabled: (state) => state.getGripperEnabled,
    selectGripperConfig: (state) => state.gripperConfig,
    selectRefreshingGripperConfigData: (state) =>
      state.refreshingGripperConfigData,
    selectFlightModesList: (state) => state.flightModes,
    selectFlightModeChannel: (state) => state.flightModeChannel,
    selectRefreshingFlightModeData: (state) => state.refreshingFlightModeData,
    selectPwmValue: (state) => state.pwmValue,
    selectFrameTypeOrder: (state) => state.frameTypeOrder,
    selectFrameTypeDirection: (state) => state.frameTypeDirection,
    selectFrameTypeName: (state) => state.frameTypeName,
    selectFrameClass: (state) => state.frameClass,
    selectNumberOfMotors: (state) => state.numberOfMotors,
    selectShowMotorTestWarningModal: (state) => state.showMotorTestWarningModal,
    selectRadioChannels: (state) => state.radioChannels,
    selectRadioChannelsConfig: (state) => state.radioChannelsConfig,
  },
})

export const {
  setGetGripperEnabled,
  setGripperConfig,
  updateGripperConfigParam,
  setRefreshingGripperConfigData,
  setFlightModesList,
  setFlightModeChannel,
  setRefreshingFlightModeData,
  setCurrentPwmValue,
  setFrameTypeOrder,
  setFrameTypeDirection,
  setFrameTypeName,
  setFrameClass,
  setNumberOfMotors,
  setShowMotorTestWarningModal,
  setRadioChannels,
  setChannelsConfig,

  // Emitters
  emitGetGripperEnabled,
  emitGetGripperConfig,
  emitSetGripperConfigParam,
  emitGetFlightModeConfig,
  emitSetFlightMode,
  emitRefreshFlightModeData,
  emitSetGripper,
  emitGetFrameConfig,
  emitTestOneMotor,
  emitTestMotorSequence,
  emitTestAllMotors,
  emitGetRcConfig,
} = configSlice.actions

export const {
  selectGetGripperEnabled,
  selectGripperConfig,
  selectRefreshingGripperConfigData,
  selectFlightModesList,
  selectFlightModeChannel,
  selectRefreshingFlightModeData,
  selectPwmValue,
  selectFrameTypeOrder,
  selectFrameTypeDirection,
  selectFrameTypeName,
  selectFrameClass,
  selectNumberOfMotors,
  selectShowMotorTestWarningModal,
  selectRadioChannels,
  selectRadioChannelsConfig,
} = configSlice.selectors

export default configSlice
