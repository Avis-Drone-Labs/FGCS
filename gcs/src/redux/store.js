import { combineSlices, configureStore } from "@reduxjs/toolkit"
import logAnalyserSlice from "./logAnalyserSlice"
import socketSlice from "./slices/socketSlice"
import droneInfoSlice from "./slices/droneInfoSlice"

import socketMiddleware from "./middleware/socketMiddleware"
import droneConnectionSlice, { setBaudrate, setConnectionType, setIp, setNetworkType, setPort, setWireless } from "./slices/droneConnectionSlice"
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

// Get the persisted state, we only want to take a couple of things from here.
const persistedState = localStorage.getItem('reduxState') 
                       ? JSON.parse(localStorage.getItem('reduxState'))
                       : {}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware])
  },
})

store.dispatch(setWireless(persistedState.droneConnection.wireless))
store.dispatch(setBaudrate(persistedState.droneConnection.baudrate))
store.dispatch(setConnectionType(persistedState.droneConnection.connection_type))
store.dispatch(setNetworkType(persistedState.droneConnection.network_type))
store.dispatch(setIp(persistedState.droneConnection.ip))
store.dispatch(setPort(persistedState.droneConnection.port))

// Update states when a new message comes in, probably inefficient
// In the future we should check to see if the variables have changed before updating
store.subscribe(() => {
  let store_mut = store.getState()
  let local_storage = window.localStorage
  local_storage.setItem('reduxState', JSON.stringify(store.getState()))

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
  local_storage.setItem(
    "networkType",
    store_mut.droneConnection.network_type,
  )
  local_storage.setItem("ip", store_mut.droneConnection.ip)
  local_storage.setItem("port", store_mut.droneConnection.port)
  local_storage.setItem("connectedToDrone", store_mut.droneConnection.connected)
})
