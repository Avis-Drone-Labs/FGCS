import { configureStore } from "@reduxjs/toolkit"
import logAnalyserReducer from "./logAnalyserSlice"
import socketSlice from "./slices/socketSlice"

import socketMiddleware from "./middleware/socketMiddleware"

export const store = configureStore({
  reducer: {
    logAnalyser: logAnalyserReducer,
    socket: socketSlice,
  },
  middleware: (getDefaultMiddleware) =>{
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware]);
  },
})
