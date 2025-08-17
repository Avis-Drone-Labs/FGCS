import { createSlice } from "@reduxjs/toolkit"

const socketSlice = createSlice({
  name: "socketConnection",
  initialState: {
    isConnected: false,
  },
  reducers: {
    initSocket: (state) => state,
    socketConnected: (state) => {
      state.isConnected = true
    },
    socketDisconnected: (state) => {
      state.isConnected = false
    },
  },
  selectors: {
    selectIsConnectedToSocket: (state) => state.isConnected,
  },
})

export const { selectIsConnectedToSocket } = socketSlice.selectors
export const { initSocket, socketConnected, socketDisconnected } =
  socketSlice.actions
export default socketSlice
