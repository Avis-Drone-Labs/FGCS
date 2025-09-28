import { combineSlices, configureStore } from "@reduxjs/toolkit"
import droneInfoSlice, { setGraphValues } from "./slices/droneInfoSlice"
import logAnalyserSlice from "./slices/logAnalyserSlice"
import socketSlice from "./slices/socketSlice"

import socketMiddleware from "./middleware/socketMiddleware"
import configSlice from "./slices/configSlice"
import droneConnectionSlice, {
  setBaudrate,
  setConnectionType,
  setIp,
  setNetworkType,
  setOutsideVisibility,
  setPort,
  setSelectedComPorts,
  setWireless,
} from "./slices/droneConnectionSlice"
import missionInfoSlice, { setPlannedHomePosition } from "./slices/missionSlice"
import paramsSlice from "./slices/paramsSlice"
import statusTextSlice from "./slices/statusTextSlice"

const rootReducer = combineSlices(
  logAnalyserSlice,
  socketSlice,
  droneConnectionSlice,
  droneInfoSlice,
  missionInfoSlice,
  statusTextSlice,
  paramsSlice,
  configSlice,
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

// Load individual persisted values from localStorage
const wireless = localStorage.getItem("wirelessConnection")
if (wireless !== null) {
  store.dispatch(setWireless(wireless === "true"))
}

const selected_com_port = localStorage.getItem("selected_com_port")
if (selected_com_port !== null) {
  store.dispatch(setSelectedComPorts(selected_com_port))
}

const baudrate = localStorage.getItem("baudrate")
if (baudrate !== null) {
  store.dispatch(setBaudrate(baudrate))
}

const connectionType = localStorage.getItem("connectionType")
if (connectionType !== null) {
  store.dispatch(setConnectionType(connectionType))
}

const networkType = localStorage.getItem("networkType")
if (networkType !== null) {
  store.dispatch(setNetworkType(networkType))
}

const ip = localStorage.getItem("ip")
if (ip !== null) {
  store.dispatch(setIp(ip))
}

const port = localStorage.getItem("port")
if (port !== null) {
  store.dispatch(setPort(port))
}

const outsideVisibility = localStorage.getItem("outsideVisibility")
if (outsideVisibility !== null) {
  store.dispatch(setOutsideVisibility(outsideVisibility === "true"))
}

const selectedRealtimeGraphs = localStorage.getItem("selectedRealtimeGraphs")
if (selectedRealtimeGraphs !== null) {
  try {
    const parsedGraphs = JSON.parse(selectedRealtimeGraphs)
    store.dispatch(setGraphValues(parsedGraphs))
  } catch (error) {
    store.dispatch(
      setGraphValues({
        graph_a: null,
        graph_b: null,
        graph_c: null,
        graph_d: null,
      }),
    )
  }
}

const plannedHomePosition = localStorage.getItem("plannedHomePosition")
if (plannedHomePosition !== null) {
  try {
    const homePos = JSON.parse(plannedHomePosition)
    // Validate the loaded planned home position, if invalid reset to 0,0,0
    if (
      !("lat" in homePos) ||
      typeof homePos.lat !== "number" ||
      !("lon" in homePos) ||
      typeof homePos.lon !== "number" ||
      !("alt" in homePos) ||
      typeof homePos.alt !== "number"
    ) {
      store.dispatch(setPlannedHomePosition({ lat: 0, lon: 0, alt: 0 }))
    } else {
      store.dispatch(setPlannedHomePosition(homePos))
    }
  } catch (error) {
    store.dispatch(setPlannedHomePosition({ lat: 0, lon: 0, alt: 0 }))
  }
}

const updateLocalStorageIfChanged = (key, newValue) => {
  if (newValue !== null && newValue !== undefined) {
    const currentValue = localStorage.getItem(key)
    const stringValue = String(newValue)
    if (currentValue !== stringValue) {
      localStorage.setItem(key, stringValue)
    }
  }
}

const updateSessionStorageIfChanged = (key, newValue) => {
  if (newValue !== null && newValue !== undefined) {
    const currentValue = sessionStorage.getItem(key)
    const stringValue = String(newValue)
    if (currentValue !== stringValue) {
      sessionStorage.setItem(key, stringValue)
    }
  }
}

const updateJSONLocalStorageIfChanged = (key, newValue) => {
  if (newValue !== null && newValue !== undefined) {
    const currentValue = localStorage.getItem(key)
    const stringValue = JSON.stringify(newValue)
    if (currentValue !== stringValue) {
      localStorage.setItem(key, stringValue)
    }
  }
}

// Update states when a new message comes in
store.subscribe(() => {
  // Temporary: Skip store subscription for FLA route to avoid delaying UI updates
  if (window.location.hash === "#/fla") {
    return
  }

  const store_mut = store.getState()

  if (typeof store_mut.droneConnection.wireless === "boolean") {
    updateLocalStorageIfChanged(
      "wirelessConnection",
      store_mut.droneConnection.wireless,
    )
  }

  if (typeof store_mut.droneConnection.selected_com_ports === "string") {
    updateLocalStorageIfChanged(
      "selected_com_port",
      store_mut.droneConnection.selected_com_ports,
    )
  }

  if (typeof store_mut.droneConnection.baudrate === "string") {
    updateLocalStorageIfChanged("baudrate", store_mut.droneConnection.baudrate)
  }

  if (typeof store_mut.droneConnection.connection_type === "string") {
    updateLocalStorageIfChanged(
      "connectionType",
      store_mut.droneConnection.connection_type,
    )
  }

  if (typeof store_mut.droneConnection.network_type === "string") {
    updateLocalStorageIfChanged(
      "networkType",
      store_mut.droneConnection.network_type,
    )
  }

  if (typeof store_mut.droneConnection.ip === "string") {
    updateLocalStorageIfChanged("ip", store_mut.droneConnection.ip)
  }

  if (typeof store_mut.droneConnection.port === "string") {
    updateLocalStorageIfChanged("port", store_mut.droneConnection.port)
  }

  if (typeof store_mut.droneConnection.outsideVisibility === "boolean") {
    updateLocalStorageIfChanged(
      "outsideVisibility",
      store_mut.droneConnection.outsideVisibility,
    )
  }

  if (typeof store_mut.droneInfo.graphs.selectedGraphs === "object") {
    updateJSONLocalStorageIfChanged(
      "selectedRealtimeGraphs",
      store_mut.droneInfo.graphs.selectedGraphs,
    )
  }

  if (typeof store_mut.droneConnection.connected === "boolean") {
    updateSessionStorageIfChanged(
      "connectedToDrone",
      store_mut.droneConnection.connected,
    )
  }

  // Store the planned home position for use in the map when no drone is connected
  if (
    store_mut.missionInfo.plannedHomePosition &&
    typeof store_mut.missionInfo.plannedHomePosition === "object"
  ) {
    updateJSONLocalStorageIfChanged(
      "plannedHomePosition",
      store_mut.missionInfo.plannedHomePosition,
    )
  }
})
