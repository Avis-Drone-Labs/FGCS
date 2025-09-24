import { createSlice } from "@reduxjs/toolkit"

const configSlice = createSlice({
  name: "config",
  initialState: {
    gripperEnabled: false,
  },
  reducers: {
    setGripperEnabled: (state, action) => {
      if (action.payload !== state.gripperEnabled) {
        state.gripperEnabled = action.payload
      }
    },

    // Emits
    emitGripperEnabled: () => {},
  },
  selectors: {
    selectGripperEnabled: (state) => state.gripperEnabled
  },
})

export const {
  setGripperEnabled,
  emitGripperEnabled
} = configSlice.actions

export const {
  selectGripperEnabled
} = configSlice.selectors

export default configSlice
