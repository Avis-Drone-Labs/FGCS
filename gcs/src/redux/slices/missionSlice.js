import { createSlice } from "@reduxjs/toolkit"
import { socket } from "../../helpers/socket"

const missionInfoSlice = createSlice({
  name: "missionInfo",
  initialState: {
    currentMission: {
      mission_state: 0,
      total: 0,
      seq: 0,
    },
    currentMissionItems: {
      // These should be camelCase etc but its easier to keep it as snake_case
      mission_items: [],
      fence_items: [],
      rally_items: [],
    },
    homePosition: {
      lat: 0,
      lon: 0,
      alt: 0,
    },
    targetInfo: {
      target_component: 0,
      target_system: 255
    }
  },
  reducers: {
    setCurrentMission: (state, action) => {
      if (action.payload === state.currentMission) return
      state.currentMission = action.payload
    },
    setCurrentMissionItems: (state, action) => {
      if (
        action.payload === state.currentMissionItems ||
        action.payload === undefined
      )
        return
      state.currentMissionItems = action.payload
    },
    setHomePosition: (state, action) => {
      if (action.payload === state.homePosition) return
      state.homePosition = action.payload
    },
    setTargetInfo: (state, action) => {
      if (action.payload === state.targetInfo) return
      state.targetInfo = action.payload
    },

    // Emits
    emitGetTargetInfo: () => {
      socket.emit("get_target_info")
    }
  },
  selectors: {
    selectCurrentMission: (state) => state.currentMission,
    selectCurrentMissionItems: (state) => state.currentMissionItems,
    selectHomePosition: (state) => state.homePosition,
    selectTargetInfo: (state) => state.targetInfo
  },
})

export const {
  selectCurrentMission,
  selectCurrentMissionItems,
  selectHomePosition,
  selectTargetInfo,
} = missionInfoSlice.selectors
export const { 
  setCurrentMission, 
  setCurrentMissionItems, 
  setHomePosition, 
  setTargetInfo,
  emitGetTargetInfo
} = missionInfoSlice.actions

export default missionInfoSlice
