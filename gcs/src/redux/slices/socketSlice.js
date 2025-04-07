import { createSlice } from "@reduxjs/toolkit";

const socketSlice = createSlice({
    name: "socketConnection",
    initialState: {
        isConnected: false
    },
    reducers: {
        initSocket: (state) => {
            return;
        },
        droneConnected: (state) => {
            state.isConnected = true;
        },
        droneDisconnected: (state) => {
            state.isConnected = false;
            get_com_ports }
    }
})

export const { initSocket, droneConnected, droneDisconnected } = socketSlice.actions;
export default socketSlice.reducer;