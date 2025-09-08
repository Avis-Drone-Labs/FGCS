import { combineSlices, configureStore } from "@reduxjs/toolkit"
import logAnalyserSlice from "./logAnalyserSlice"
import socketSlice from "./slices/socketSlice"
import droneInfoSlice, { setGraphValues } from "./slices/droneInfoSlice"

import socketMiddleware from "./middleware/socketMiddleware"
import droneConnectionSlice, {
  setBaudrate,
  setConnectionType,
  setIp,
  setNetworkType,
  setPort,
  setWireless,
} from "./slices/droneConnectionSlice"
import missionInfoSlice from "./slices/missionSlice"
import statusTextSlice from "./slices/statusTextSlice"
import notificationSlice from "./slices/notificationSlice"
import loggingSlice from "./slices/loggingSlice"
import loggingMiddleware from "./middleware/loggingMiddleware"
import { registerLoggingStore } from "../helpers/logging"

const rootReducer = combineSlices(
  logAnalyserSlice,
  socketSlice,
  droneConnectionSlice,
  droneInfoSlice,
  missionInfoSlice,
  statusTextSlice,
  notificationSlice,
  loggingSlice,
)

// Get the persisted state, we only want to take a couple of things from here.
const persistedState = localStorage.getItem("reduxState")
  ? JSON.parse(localStorage.getItem("reduxState"))
  : {}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware, loggingMiddleware])
  },
})

let droneConnection = persistedState.droneConnection
let droneInfo = persistedState.droneInfo
if (droneConnection !== undefined) {
  if (droneConnection.wireless !== undefined) {
    store.dispatch(setWireless(droneConnection.wireless))
  }
  if (droneConnection.baudrate !== undefined) {
    store.dispatch(setBaudrate(droneConnection.baudrate))
  }
  if (droneConnection.connection_type !== undefined) {
    store.dispatch(setConnectionType(droneConnection.connection_type))
  }
  if (droneConnection.network_type !== undefined) {
    store.dispatch(setNetworkType(droneConnection.network_type))
  }
  if (droneConnection.ip !== undefined) {
    store.dispatch(setIp(droneConnection.ip))
  }
  if (droneConnection.port !== undefined) {
    store.dispatch(setPort(droneConnection.port))
  }
  if (droneInfo !== undefined && droneInfo.graphs && droneInfo.graphs.selectedGraphs !== undefined) {
    store.dispatch(setGraphValues(droneInfo.graphs.selectedGraphs))
  }
}

registerLoggingStore(store)

// Update states when a new message comes in, probably inefficient
// TODO: In the future we should check to see if the variables have changed before updating
store.subscribe(() => {
  let store_mut = store.getState()
  let local_storage = window.localStorage
  let session_storage = window.sessionStorage
  local_storage.setItem("reduxState", JSON.stringify(store.getState()))

  // Drone connection
  local_storage.setItem(
    "wirelessConnection",
    store_mut.droneConnection.wireless,
  )
  local_storage.setItem("baudrate", store_mut.droneConnection.baudrate)
  local_storage.setItem(
    "connectionType",
    store_mut.droneConnection.connection_type,
  )
  local_storage.setItem("networkType", store_mut.droneConnection.network_type)
  local_storage.setItem("ip", store_mut.droneConnection.ip)
  local_storage.setItem("port", store_mut.droneConnection.port)
  local_storage.setItem(
    "selectedRealtimeGraphs",
    store_mut.droneInfo.graphs.selectedGraphs,
  )
  session_storage.setItem(
    "connectedToDrone",
    store_mut.droneConnection.connected,
  )
})
