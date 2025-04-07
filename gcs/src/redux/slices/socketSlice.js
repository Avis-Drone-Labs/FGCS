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
        }
    }
})

export const { initSocket, droneConnected, droneDisconnected } = droneSocketSlice.actions;
export default droneSocketSlice.reducer;