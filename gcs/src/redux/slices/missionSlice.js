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
    drawingItems: {
      // This is for the missions page, used locally and then will update currentMissionItems on save
      missionItems: [],
      fenceItems: [],
      rallyItems: []
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
    setDrawingMissionItems: (state, action) => {
      if (action.payload === state.drawingItems.missionItems) return
      state.drawingItems.missionItems = action.payload
    },
    setDrawingFenceItems: (state, action) => {
      if (action.payload === state.drawingItems.fenceItems) return
      state.drawingItems.missionItems = action.payload
    },
    setDrawingRallyItems: (state, action) => {
      if (action.payload === state.drawingItems.rallyItems) return
      state.drawingItems.rallyItems = action.payload
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
    selectTargetInfo: (state) => state.targetInfo,
    selectDrawingMissionItems: (state) => state.drawingItems.missionItems,
    selectDrawingFenceItems: (state) => state.drawingItems.fenceItems,
    selectDrawingRallyItems: (state) => state.drawingItems.rallyItems
  },
})

export const {
  selectCurrentMission,
  selectCurrentMissionItems,
  selectHomePosition,
  selectTargetInfo,
  selectDrawingMissionItems,
  selectDrawingFenceItems,
  selectDrawingRallyItems,
} = missionInfoSlice.selectors
export const { 
  setCurrentMission, 
  setCurrentMissionItems, 
  setHomePosition, 
  setTargetInfo,
  setDrawingMissionItems,
  setDrawingFenceItems,
  setDrawingRallyItems,
  emitGetTargetInfo
} = missionInfoSlice.actions

export default missionInfoSlice
