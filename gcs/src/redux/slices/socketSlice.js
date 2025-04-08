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
        socketConnected: (state) => {
            state.isConnected = true;
        },
        socketDisconnected: (state) => {
            state.isConnected = false;
            get_com_ports }
    }
})

export const { initSocket, socketConnected, socketDisconnected } = socketSlice.actions;
export default socketSlice
