import { combineSlices, configureStore } from "@reduxjs/toolkit"
import logAnalyserSlice from "./logAnalyserSlice"
import socketSlice from "./slices/socketSlice"
import droneInfoSlice from "./slices/droneInfoSlice"

import socketMiddleware from "./middleware/socketMiddleware"
import droneConnectionSlice from "./slices/droneConnectionSlice"
import missionInfoSlice from "./slices/missionSlice"
import statusTextSlice from "./slices/statusTextSlice"
import notificationSlice from "./slices/notificationSlice"

const rootReducer = combineSlices(
  logAnalyserSlice,
  socketSlice,
  droneConnectionSlice,
  droneInfoSlice,
  missionInfoSlice,
  statusTextSlice,
  notificationSlice,
)

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware])
  },
})
