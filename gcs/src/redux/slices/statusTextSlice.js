import { createSlice } from "@reduxjs/toolkit"

const statusTextSlice = createSlice({
  name: "statustext",
  initialState: { messages: [] },
  reducers: {
    pushMessage: (state, action) => {
      state.messages.unshift(action.payload)
    },
    resetMessages: (state) => {
      state.messages = []
    },
  },
  selectors: {
    selectMessages: (state) => {
      return state.messages
    },
  },
})

export const { pushMessage, resetMessages } = statusTextSlice.actions
export const { selectMessages } = statusTextSlice.selectors

export default statusTextSlice
