import { createSelector, createSlice } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"
import { isGlobalFrameHomeCommand } from "../../helpers/filterMissions"
import { MAV_FRAME_LIST } from "../../helpers/mavlinkConstants"

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
    updatePlannedHomePositionFromLoadData: {
      lat: null,
      lon: null,
      alt: null,
      from: "", // "file" or "drone"
    },
    modals: {
      missionProgressModal: false,
      updatePlannedHomePositionFromLoadModal: false,
    },
    plannedHomePosition: {
      lat: 0,
      lon: 0,
      alt: 0,
    },
    targetInfo: {
      target_component: 0,
      target_system: 255,
    },
    activeTab: "mission",
    contextMenu: {
      isOpen: false,
      position: { x: 0, y: 0 },
      menuSize: { width: 0, height: 0 },
      canvasSize: { width: 0, height: 0 },
      gpsCoords: { lat: 0, lng: 0 },
      markerId: null,
    },
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
    setPlannedHomePosition: (state, action) => {
      if (action.payload === state.plannedHomePosition) return
      state.plannedHomePosition = action.payload

      if (
        state.drawingItems.missionItems.length > 0 &&
        isGlobalFrameHomeCommand(state.drawingItems.missionItems[0])
      ) {
        state.drawingItems.missionItems[0] = {
          ...state.drawingItems.missionItems[0],
          x: action.payload.lat,
          y: action.payload.lon,
        }
      } else {
        const newHomeItem = {
          id: uuidv4(),
          seq: 0, // Home position is always the first item
          x: action.payload.lat,
          y: action.payload.lon,
          z: action.payload.alt || 0,
          frame: getFrameKey("MAV_FRAME_GLOBAL"),
          command: 16, // MAV_CMD_NAV_WAYPOINT
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
          current: 1, // Set as current waypoint
          autocontinue: 1,
          target_component: state.targetInfo.target_component,
          target_system: state.targetInfo.target_system,
          mission_type: 0,
          mavpackettype: "MISSION_ITEM_INT",
        }

        state.drawingItems.missionItems = [
          newHomeItem,
          ...state.drawingItems.missionItems,
        ]
      }
    },
    setTargetInfo: (state, action) => {
      if (action.payload === state.targetInfo) return
      state.targetInfo = action.payload
    },
    updateDrawingItem: (state, action) => {
      const payload = action.payload
      const _type = `${state.activeTab}Items`

      const index = state.drawingItems[_type].findIndex(
        (i) => i.id === payload.id,
      )
      if (index === -1) return

      const currentItem = state.drawingItems[_type][index]

      if (currentItem === payload) return

      state.drawingItems[_type][index] = { ...currentItem, ...payload }
      state.unwrittenChanges = {
        ...state.unwrittenChanges,
        [state.activeTab]: true,
      }
    },
    removeDrawingItem: (state, action) => {
      const id = action.payload
      const _type = `${state.activeTab}Items`

      const index = state.drawingItems[_type].findIndex((i) => i.id === id)
      if (index === -1) return

      state.drawingItems[_type] = state.drawingItems[_type]
        .filter((s) => s.id !== id)
        .map((item, index) => {
          return { ...item, seq: index }
        })
      state.unwrittenChanges = {
        ...state.unwrittenChanges,
        [state.activeTab]: true,
      }
    },
    reorderDrawingItem: (state, action) => {
      const { id, increment } = action.payload
      const _type = `${state.activeTab}Items`
      const index = state.drawingItems[_type].findIndex((i) => i.id === id)

      if (
        index === -1 ||
        (increment === -1 && index === 0) ||
        (increment === 1 && index === state.drawingItems[_type].length - 1)
      ) {
        return // Prevents reordering if index is out of bounds or at the edge of the list
      }

      ;[
        state.drawingItems[_type][index],
        state.drawingItems[_type][index + increment],
      ] = [
        { ...state.drawingItems[_type][index + increment], seq: index },
        { ...state.drawingItems[_type][index], seq: index + increment },
      ]
      state.unwrittenChanges = {
        ...state.unwrittenChanges,
        [state.activeTab]: true,
      }
    },
    createNewDrawingItem: (state, action) => {
      const { x, y } = action.payload
      const drawingItem = newMissionItem(x, y, state.targetInfo)

      const _type = `${state.activeTab}Items`

      drawingItem.seq = state.drawingItems[_type].length
      drawingItem.command = { mission: 16, fence: 5004, rally: 5100 }[
        state.activeTab
      ]
      drawingItem.mission_type = { mission: 0, fence: 1, rally: 2 }[
        state.activeTab
      ]

      if (state.activeTab == "fence") {
        drawingItem.param1 = 5
        drawingItem.frame = getFrameKey("MAV_FRAME_GLOBAL")
      }

      state.drawingItems[_type].push(drawingItem)
      state.unwrittenChanges = {
        ...state.unwrittenChanges,
        [state.activeTab]: true,
      }
    },
    clearDrawingItems: (state) => {
      const _type = `${state.activeTab}Items`

      if (state.drawingItems[_type].length === 0) return

      if (
        state.activeTab == "mission" &&
        state.drawingItems.missionItems.length > 0 &&
        isGlobalFrameHomeCommand(state.drawingItems.missionItems[0])
      ) {
        state.drawingItems.missionItems = [state.drawingItems.missionItems[0]]
      } else {
        state.drawingItems[_type] = []
      }
      state.unwrittenChanges = {
        ...state.unwrittenChanges,
        [state.activeTab]: true,
      }
    },
    createFencePolygon: (state, action) => {
      const items = action.payload

      state.drawingItems.fenceItems = [
        ...state.drawingItems.fenceItems,
        ...items.map((item, index) => ({
          ...newMissionItem(item.x, item.y, state.targetInfo),
          ...item,
          seq: state.drawingItems.fenceItems.length + index,
        })),
      ]
      state.unwrittenChanges.fence = true
    },
    setDrawingMissionItems: (state, action) => {
      if (action.payload === state.drawingItems.missionItems) return
      state.drawingItems.missionItems = action.payload
    },
    setDrawingFenceItems: (state, action) => {
      if (action.payload === state.drawingItems.fenceItems) return
      state.drawingItems.fenceItems = action.payload
    },
    setDrawingRallyItems: (state, action) => {
      if (action.payload === state.drawingItems.rallyItems) return
      state.drawingItems.rallyItems = action.payload
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
    resetMissionProgressData: (state) => {
      if (
        !state.missionProgressData.message &&
        !state.missionProgressData.progress
      )
        return
      state.missionProgressData = { message: "", progress: null }
    },
    setUpdatePlannedHomePositionFromLoadModal: (state, action) => {
      if (
        action.payload === state.modals.updatePlannedHomePositionFromLoadModal
      )
        return
      state.modals.updatePlannedHomePositionFromLoadModal = action.payload
    },
    setUpdatePlannedHomePositionFromLoadData: (state, action) => {
      if (action.payload === state.updatePlannedHomePositionFromLoadData) return
      state.updatePlannedHomePositionFromLoadData = action.payload
    },
    resetUpdatePlannedHomePositionFromLoadData: (state) => {
      state.updatePlannedHomePositionFromLoadData = {
        lat: null,
        lon: null,
        alt: null,
        from: "", // "file" or "drone"
      }
    },
    updateContextMenuState: (state, action) => {
      if (action.payload === state.contextMenu) return

      // Update the position of the context menu to ensure it fits within the canvas

      const updatedState = {
        ...state.contextMenu,
        ...action.payload,
      }

      const contextMenuWidth = updatedState.menuSize.width
      const contextMenuHeight = updatedState.menuSize.height
      let x = updatedState.position.x
      let y = updatedState.position.y

      if (
        contextMenuWidth + updatedState.position.x >
        updatedState.canvasSize.width
      ) {
        x = updatedState.position.x - contextMenuWidth
      }
      if (
        contextMenuHeight + updatedState.position.y >
        updatedState.canvasSize.height
      ) {
        y = updatedState.position.y - contextMenuHeight
      }

      state.contextMenu = {
        ...updatedState,
        position: { x: x, y: y },
      }
    },

    // Emits
    emitGetTargetInfo: () => {},
    emitGetCurrentMission: () => {},
    emitWriteCurrentMission: () => {},
    emitImportMissionFromFile: () => {},
    emitExportMissionToFile: () => {},
  },
  selectors: {
    selectCurrentMission: (state) => state.currentMission,
    selectCurrentMissionItems: (state) => state.currentMissionItems,
    selectPlannedHomePosition: (state) => state.plannedHomePosition,
    selectUpdatePlannedHomePositionFromLoadModal: (state) =>
      state.modals.updatePlannedHomePositionFromLoadModal,
    selectUpdatePlannedHomePositionFromLoadData: (state) =>
      state.updatePlannedHomePositionFromLoadData,
    selectTargetInfo: (state) => state.targetInfo,
    selectDrawingMissionItems: (state) => state.drawingItems.missionItems,
    selectDrawingFenceItems: (state) => state.drawingItems.fenceItems,
    selectDrawingRallyItems: (state) => state.drawingItems.rallyItems,
    selectUnwrittenChanges: (state) => state.unwrittenChanges,
    selectFirstUnwrittenTab: (state) =>
      Object.entries(state.unwrittenChanges).find(([, changed]) => changed),
    selectMissionProgressModal: (state) => state.modals.missionProgressModal,
    selectMissionProgressData: (state) => state.missionProgressData,
    selectActiveTab: (state) => state.activeTab,
    selectContextMenu: (state) => state.contextMenu,
  },
})

export const selectDrawingMissionItemByIdx = (index) =>
  createSelector(
    [missionInfoSlice.selectors.selectDrawingMissionItems],

    (missionItems) => missionItems.at(index),
  )

export const selectDrawingFenceItemByIdx = (index) =>
  createSelector(
    [missionInfoSlice.selectors.selectDrawingFenceItems],

    (fenceItems) => fenceItems.at(index),
  )

export const selectDrawingRallyItemByIdx = (index) =>
  createSelector(
    [missionInfoSlice.selectors.selectDrawingRallyItems],

    (rallyItems) => rallyItems.at(index),
  )

export const addIdToItem = (missionItem) => {
  if (!missionItem.id) {
    missionItem.id = uuidv4()
  }
  return missionItem
}

export const updatePlannedHomePositionBasedOnLoadedWaypointsThunk =
  () => (dispatch, getState) => {
    const { updatePlannedHomePositionFromLoadData } = getState().missionInfo
    dispatch(
      setPlannedHomePosition({
        lat: updatePlannedHomePositionFromLoadData.lat,
        lon: updatePlannedHomePositionFromLoadData.lon,
        alt: updatePlannedHomePositionFromLoadData.alt,
      }),
    )
    dispatch(resetUpdatePlannedHomePositionFromLoadData())
    dispatch(setUpdatePlannedHomePositionFromLoadModal(false))
  }

export const getFrameKey = (frame) =>
  parseInt(
    Object.keys(MAV_FRAME_LIST).find((key) => MAV_FRAME_LIST[key] == frame),
  )

export const newMissionItem = (x, y, targetInfo) => {
  return {
    id: uuidv4(),
    seq: null,
    x: x,
    y: y,
    z: 30,
    frame: getFrameKey("MAV_FRAME_GLOBAL_RELATIVE_ALT"),
    command: null,
    param1: 0,
    param2: 0,
    param3: 0,
    param4: 0,
    current: 0,
    autocontinue: 1,
    target_component: targetInfo.target_component,
    target_system: targetInfo.target_system,
    mission_type: null,
    mavpackettype: "MISSION_ITEM_INT",
  }
}

export const {
  selectCurrentMission,
  selectCurrentMissionItems,
  selectPlannedHomePosition,
  selectUpdatePlannedHomePositionFromLoadModal,
  selectUpdatePlannedHomePositionFromLoadData,
  selectTargetInfo,
  selectDrawingMissionItems,
  selectDrawingFenceItems,
  selectDrawingRallyItems,
  selectUnwrittenChanges,
  selectFirstUnwrittenTab,
  selectMissionProgressModal,
  selectMissionProgressData,
  selectActiveTab,
  selectContextMenu,
} = missionInfoSlice.selectors

export const {
  setCurrentMission,
  setCurrentMissionItems,
  setPlannedHomePosition,
  setUpdatePlannedHomePositionFromLoadModal,
  setUpdatePlannedHomePositionFromLoadData,
  resetUpdatePlannedHomePositionFromLoadData,
  setTargetInfo,
  updateDrawingItem,
  removeDrawingItem,
  reorderDrawingItem,
  createNewDrawingItem,
  clearDrawingItems,
  createFencePolygon,
  setDrawingMissionItems,
  setDrawingFenceItems,
  setDrawingRallyItems,
  setUnwrittenChanges,
  setMissionProgressModal,
  setActiveTab,
  setMissionProgressData,
  resetMissionProgressData,
  updateContextMenuState,
  emitGetTargetInfo,
  emitGetCurrentMission,
  emitWriteCurrentMission,
  emitImportMissionFromFile,
  emitExportMissionToFile,
} = missionInfoSlice.actions

export default missionInfoSlice
