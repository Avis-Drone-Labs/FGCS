import { createSlice } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"
import { isGlobalFrameHomeCommand } from "../../helpers/filterMissions"
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
      rallyItems: [],
    },
    unwrittenChanges: {
      mission: false,
      fence: false,
      rally: false,
    },
    missionProgressData: {
      message: "",
      progress: null,
    },
    modals: {
      missionProgressModal: false,
    },
    homePosition: {
      lat: 0,
      lon: 0,
      alt: 0,
    },
    targetInfo: {
      target_component: 0,
      target_system: 255,
    },
    activeTab: "mission",
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
    updateDrawingMissionItem: (state, action) => {
      const index = state.drawingItems.missionItems.findIndex(
        (i) => i.id === action.payload.id,
      )

      if (index === -1) return

      const currentItem = state.drawingItems.missionItems[index]

      if (JSON.stringify(currentItem) === JSON.stringify(action.payload)) return

      state.drawingItems.missionItems[index] = {
        ...currentItem,
        ...action.payload,
      }
    },
    appendDrawingMissionItem: (state, action) => {
      state.drawingItems.missionItems.push({
        ...action.payload,
        seq: state.drawingItems.missionItems.length,
      })
    },
    deleteDrawingMissionItem: (state, action) => {
      const updatedItems = state.drawingItems.missionItems.filter(
        (item) => item.id !== action.payload,
      )
      state.drawingItems.missionItems = updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    },
    setDrawingFenceItems: (state, action) => {
      if (action.payload === state.drawingItems.fenceItems) return
      state.drawingItems.fenceItems = action.payload
    },
    updateDrawingFenceItem: (state, action) => {
      const index = state.drawingItems.fenceItems.findIndex(
        (i) => i.id === action.payload.id,
      )

      if (index === -1) return

      const currentItem = state.drawingItems.fenceItems[index]

      if (JSON.stringify(currentItem) === JSON.stringify(action.payload)) return

      state.drawingItems.fenceItems[index] = {
        ...currentItem,
        ...action.payload,
      }
    },
    appendDrawingFenceItem: (state, action) => {
      state.drawingItems.fenceItems.push({
        ...action.payload,
        seq: state.drawingItems.fenceItems.length,
      })
    },
    deleteDrawingFenceItem: (state, action) => {
      const updatedItems = state.drawingItems.fenceItems.filter(
        (item) => item.id !== action.payload,
      )
      state.drawingItems.fenceItems = updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    },
    setDrawingRallyItems: (state, action) => {
      if (action.payload === state.drawingItems.rallyItems) return
      state.drawingItems.rallyItems = action.payload
    },
    updateDrawingRallyItem: (state, action) => {
      const index = state.drawingItems.rallyItems.findIndex(
        (i) => i.id === action.payload.id,
      )

      if (index === -1) return

      const currentItem = state.drawingItems.rallyItems[index]

      if (JSON.stringify(currentItem) === JSON.stringify(action.payload)) return

      state.drawingItems.rallyItems[index] = {
        ...currentItem,
        ...action.payload,
      }
    },
    appendDrawingRallyItem: (state, action) => {
      state.drawingItems.rallyItems.push({
        ...action.payload,
        seq: state.drawingItems.rallyItems.length,
      })
    },
    deleteDrawingRallyItem: (state, action) => {
      const updatedItems = state.drawingItems.rallyItems.filter(
        (item) => item.id !== action.payload,
      )
      state.drawingItems.rallyItems = updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    },
    setUnwrittenChanges: (state, action) => {
      if (action.payload === state.unwrittenChanges) return
      state.unwrittenChanges = action.payload
    },
    setMissionProgressModal: (state, action) => {
      if (action.payload === state.modals.missionProgressModal) return
      state.modals.missionProgressModal = action.payload
    },
    setActiveTab: (state, action) => {
      if (action.payload === state.activeTab) return
      state.activeTab = action.payload
    },
    setMissionProgressData: (state, action) => {
      if (action.payload === state.missionProgressData) return
      state.missionProgressData = action.payload
    },

    // Emits
    emitGetTargetInfo: () => {
      socket.emit("get_target_info")
    },
    emitGetCurrentMission: (state) => {
      socket.emit("get_current_mission", { type: state.activeTab })
    },
    emitWriteCurrentMission: (_, action) => {
      socket.emit("write_current_mission", {
        type: action.payload.type,
        items: action.payload.items,
      })
    },
    emitImportMissionFromFile: (_, action) => {
      socket.emit("import_mission_from_file", {
        type: action.payload.type,
        file_path: action.payload.file_path,
      })
    },
    emitExportMissionToFile: (_, action) => {
      socket.emit("export_mission_to_file", {
        type: action.payload.type,
        file_path: action.payload.file_path,
        items: action.payload.items,
      })
    },
  },
  selectors: {
    selectCurrentMission: (state) => state.currentMission,
    selectCurrentMissionItems: (state) => state.currentMissionItems,
    selectHomePosition: (state) => state.homePosition,
    selectTargetInfo: (state) => state.targetInfo,
    selectDrawingMissionItems: (state) => state.drawingItems.missionItems,
    selectDrawingFenceItems: (state) => state.drawingItems.fenceItems,
    selectDrawingRallyItems: (state) => state.drawingItems.rallyItems,
    selectUnwrittenChanges: (state) => state.unwrittenChanges,
    selectMissionProgressModal: (state) => state.modals.missionProgressModal,
    selectMissionProgressData: (state) => state.missionProgressData,
    selectActiveTab: (state) => state.activeTab,
  },
})

export const addIdToItem = (missionItem) => {
  if (!missionItem.id) {
    missionItem.id = uuidv4()
  }
  return missionItem
}

export const updateHomePositionBasedOnWaypoints = (waypoints) => {
  if (waypoints.length > 0) {
    const potentialHomeLocation = waypoints[0]
    if (isGlobalFrameHomeCommand(potentialHomeLocation)) {
      setHomePosition({
        lat: potentialHomeLocation.x,
        lon: potentialHomeLocation.y,
        alt: potentialHomeLocation.z,
      })
    }
  }
}

export const {
  selectCurrentMission,
  selectCurrentMissionItems,
  selectHomePosition,
  selectTargetInfo,
  selectDrawingMissionItems,
  selectDrawingFenceItems,
  selectDrawingRallyItems,
  selectUnwrittenChanges,
  selectMissionProgressModal,
  selectMissionProgressData,
  selectActiveTab,
} = missionInfoSlice.selectors
export const {
  setCurrentMission,
  setCurrentMissionItems,
  setHomePosition,
  setTargetInfo,
  setDrawingMissionItems,
  setDrawingFenceItems,
  setDrawingRallyItems,
  updateDrawingMissionItem,
  updateDrawingFenceItem,
  updateDrawingRallyItem,
  appendDrawingMissionItem,
  appendDrawingFenceItem,
  appendDrawingRallyItem,
  deleteDrawingMissionItem,
  deleteDrawingFenceItem,
  deleteDrawingRallyItem,
  setUnwrittenChanges,
  setMissionProgressModal,
  setActiveTab,
  setMissionProgressData,
  emitGetTargetInfo,
  emitGetCurrentMission,
  emitWriteCurrentMission,
  emitImportMissionFromFile,
  emitExportMissionToFile,
} = missionInfoSlice.actions

export default missionInfoSlice
