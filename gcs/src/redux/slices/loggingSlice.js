import { createSlice } from "@reduxjs/toolkit";

const KEEP_LATEST_N_LOGS = 50;

const loggingSlice = createSlice({
    name: "logging",
    initialState: {
        logHistory: [],
        handlers: [],
        debugLogCount: 0
    },
    reducers: {
        emitLog: (state, action) => {
            state.logHistory.push(action.payload);
            if (state.logHistory.length > KEEP_LATEST_N_LOGS) state.logHistory.shift();

            state.handlers.forEach(handler => {
                handler({...action.payload, message: `${state.debugLogCount} ${action.payload.message}`, timestamp: action.payload.timestamp ?? Date.now() / 1000});
            })
            state.debugLogCount += 1
        },
        registerHandler: (state, action) => {
            if (action.payload in state.handlers) return;
            state.handlers.push(action.payload);
        }
    },
    selectors: {
        selectRecentLogs: (state) => state.logHistory,
        selectMostRecent: (state, n) => state.logHistory.slice(-n, -1)
    },

})

export const {emitLog, registerHandler} = loggingSlice.actions
export const {selectMostRecent, selectRecentLogs} = loggingSlice.selectors

export default loggingSlice