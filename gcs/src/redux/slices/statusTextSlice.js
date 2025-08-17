import { createSlice } from "@reduxjs/toolkit"

const statusTextSlice = createSlice({
  name: "statustext",
  initialState: { messages: [] },
  reducers: {
    pushMessage: (state, action) => {
      state.messages.push(action.payload)
    },
  },
  selectors: {
    selectMessages: (state) => {
      return state.messages
    },
  },
})

export const { pushMessage } = statusTextSlice.actions
export const { selectMessages } = statusTextSlice.selectors

export default statusTextSlice
