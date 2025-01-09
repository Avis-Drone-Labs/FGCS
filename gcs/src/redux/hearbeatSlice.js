import { createSlice } from "@reduxjs/toolkit"

const hearbeatSlice = createSlice({
  name: "heartbeat",
  initialState: {
    heartbeatData: { system_status: 0 },
    previousHeartbeatData: { system_status: 0 },
  },
  reducers: {
    setHeartbeatData: (state, action) => {
      state.previousHeartbeatData = state.heartbeatData
      state.heartbeatData = action.payload
    },
  },
})

export const { setHeartbeatData } = hearbeatSlice.actions

export default hearbeatSlice.reducer
