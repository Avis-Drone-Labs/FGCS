import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  confirmExitModalOpen: false,
}

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    // Setters
    setConfirmExitModalOpen: (state, action) => {
      if (action.payload !== state.confirmExitModalOpen) {
        state.confirmExitModalOpen = action.payload
      }
    },
  },
  selectors: {
    selectConfirmExitModalOpen: (state) => state.confirmExitModalOpen,
  },
})

export const {
	setConfirmExitModalOpen
} = applicationSlice.actions
export const {
	selectConfirmExitModalOpen
} = applicationSlice.selectors

export default applicationSlice
