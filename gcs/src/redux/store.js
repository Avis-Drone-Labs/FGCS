import { combineSlices, configureStore } from "@reduxjs/toolkit"
import armedMiddleware from "./middleware/armedMiddleware"
import socketMiddleware from "./middleware/socketMiddleware"
import applicationSlice from "./slices/applicationSlice"
import checklistSlice, { setChecklistItems } from "./slices/checklistSlice"
import configSlice from "./slices/configSlice"
import droneConnectionSlice, {
  setBaudrate,
  setConnectionType,
  setForwardingAddress,
  setIp,
  setIsForwarding,
  setNetworkType,
  setOutsideVisibility,
  setPort,
  setSelectedComPorts,
  setWireless,
} from "./slices/droneConnectionSlice"
import droneInfoSlice, { setGraphValues } from "./slices/droneInfoSlice"
import ftpSlice from "./slices/ftpSlice"
import logAnalyserSlice from "./slices/logAnalyserSlice"
import missionInfoSlice, { setPlannedHomePosition } from "./slices/missionSlice"
import paramsSlice from "./slices/paramsSlice"
import socketSlice from "./slices/socketSlice"
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
  checklistSlice,
  applicationSlice,
  ftpSlice,
)

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware, armedMiddleware])
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

const forwardingAddress = localStorage.getItem("forwardingAddress")
if (forwardingAddress !== null) {
  store.dispatch(setForwardingAddress(forwardingAddress))
}

const isForwarding = localStorage.getItem("isForwarding")
if (isForwarding !== null) {
  store.dispatch(setIsForwarding(isForwarding === "true"))
}

const outsideVisibility = localStorage.getItem("outsideVisibility")
if (outsideVisibility !== null) {
  store.dispatch(setOutsideVisibility(outsideVisibility === "true"))
}

const preFlightChecklist = localStorage.getItem("preFlightChecklist")
if (preFlightChecklist !== null) {
  try {
    store.dispatch(setChecklistItems(JSON.parse(preFlightChecklist)))
  } catch {
    console.log(
      "Failed to parse JSON from pre flight checklist items, resetting to blank array.",
    )
  }
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

  if (typeof store_mut.droneConnection.forwardingAddress === "string") {
    updateLocalStorageIfChanged(
      "forwardingAddress",
      store_mut.droneConnection.forwardingAddress,
    )
  }

  if (typeof store_mut.droneConnection.isForwarding === "boolean") {
    updateLocalStorageIfChanged(
      "isForwarding",
      store_mut.droneConnection.isForwarding,
    )
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

  if (typeof store_mut.checklist.items === "object") {
    updateJSONLocalStorageIfChanged(
      "preFlightChecklist",
      store_mut.checklist.items,
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
