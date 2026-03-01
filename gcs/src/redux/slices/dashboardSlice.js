import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    menuSize: { width: 0, height: 0 },
    canvasSize: { width: 0, height: 0 },
    gpsCoords: { lat: 0, lng: 0 },
    markerId: null,
  },
}

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    updateDashboardContextMenuState: (state, action) => {
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
  },
  selectors: {
    selectDashboardContextMenu: (state) => state.contextMenu,
  },
})

export const { updateDashboardContextMenuState } = dashboardSlice.actions

export const { selectDashboardContextMenu } = dashboardSlice.selectors

export default dashboardSlice
