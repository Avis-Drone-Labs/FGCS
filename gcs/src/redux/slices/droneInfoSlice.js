import { createSelector, createSlice } from "@reduxjs/toolkit"
import { defaultDataMessages } from "../../helpers/dashboardDefaultDataMessages"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_STATE,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../helpers/mavlinkConstants"

const droneInfoSlice = createSlice({
  name: "droneInfo",
  initialState: {
    attitudeData: {
      roll: 0.0,
      pitch: 0.0,
      yaw: 0.0,
    },
    telemetryData: {
      airspeed: 0.0,
      groundspeed: 0.0,
    },
    gpsData: {
      lat: 0.0,
      lon: 0.0,
      hdg: 0.0,
      alt: 0.0,
      relativeAlt: 0.0,
    },
    navControllerData: {
      navBearing: 0.0,
      wpDist: 0.0,
      loiterRadius: 80.0,
    },
    heartbeatData: {
      baseMode: 0,
      customMode: 0,
      systemStatus: 0,
    },
    onboardControlSensorsEnabled: 0,
    gpsRawIntData: {
      fixType: 0,
      satellitesVisible: 0,
    },
    rssi: 0.0,
    notificationSound: "",
    aircraftType: 0, // TODO: This should be in local storage but I have no idea how :D,
    batteryData: [],
    extraDroneData: [
      ...defaultDataMessages, // TODO: Should also be stored in local storage, values set to 0 on launch but actual messages stored
    ],
    graphs: {
      selectedGraphs: {
        graph_a: null,
        graph_b: null,
        graph_c: null,
        graph_d: null,
      },
      lastGraphResultsMessage: false,
    },
  },
  reducers: {
    setHeartbeatData: (state, action) => {
      if (
        action.payload.base_mode & 128 &&
        !(state.heartbeatData.baseMode & 128)
      ) {
        state.notificationSound = "armed"
      } else if (
        !(action.payload.base_mode & 128) &&
        state.heartbeatData.baseMode & 128
      ) {
        state.notificationSound = "disarmed"
      }
      state.heartbeatData.baseMode = action.payload.base_mode
      state.heartbeatData.customMode = action.payload.custom_mode
      state.heartbeatData.systemStatus = action.payload.system_status
    },
    setBatteryData: (state, action) => {
      const battery = state.batteryData.filter(
        (battery) => battery.id == action.payload.id,
      )[0]
      if (battery) {
        Object.assign(battery, action.payload)
      } else {
        state.batteryData.push(action.payload)
      }
    },
    soundPlayed: (state) => {
      state.notificationSound = ""
    },
    changeExtraData: (state, action) => {
      state.extraDroneData[action.payload.index] = {
        ...state.extraDroneData[action.payload.index],
        ...action.payload.data,
      }
    },
    setExtraData: (state, action) => {
      if (action.payload !== state.extraDroneData) {
        state.extraDroneData = action.payload
      }
    },
    setDroneAircraftType: (state, action) => {
      if (action.payload !== state.aircraftType) {
        state.aircraftType = action.payload
      }
    },
    setTelemetryData: (state, action) => {
      if (action.payload !== state.telemetryData) {
        state.telemetryData = action.payload
      }
    },
    setGpsData: (state, action) => {
      if (action.payload !== state.gpsData) {
        state.gpsData = action.payload
      }
    },
    setAttitudeData: (state, action) => {
      if (action.payload !== state.attitudeData) {
        state.attitudeData = action.payload
      }
    },
    setNavControllerOutput: (state, action) => {
      if (action.payload !== state.navControllerData) {
        state.navControllerData.wpDist = action.payload.wp_dist
        state.navControllerData.navBearing = action.payload.nav_bearing
      }
    },
    setGpsRawIntData: (state, action) => {
      if (action.payload !== state.gpsRawIntData) {
        state.gpsRawIntData.satellitesVisible =
          action.payload.satellites_visible
        state.gpsRawIntData.fixType = action.payload.fix_type
      }
    },
    setOnboardControlSensorsEnabled: (state, action) => {
      if (action.payload !== state.onboardControlSensorsEnabled) {
        state.onboardControlSensorsEnabled = action.payload
      }
    },
    setRSSIData: (state, action) => {
      if (action.payload !== state.rssi) {
        state.rssi = action.payload
      }
    },
    setGraphValues: (state, action) => {
      if (action.payload !== state.graphs.selectedGraphs) {
        state.graphs.selectedGraphs = action.payload
      }
    },
    setLastGraphMessage: (state, action) => {
      if (action.payload !== state.graphs.lastGraphResultsMessage) {
        state.graphs.lastGraphResultsMessage = action.payload
      }
    },
    setLoiterRadius: (state, action) => {
      if (action.payload !== state.navControllerData.loiterRadius) {
        state.navControllerData.loiterRadius = action.payload
      }
    },
  },
  selectors: {
    selectAttitude: (state) => state.attitudeData,
    selectTelemetry: (state) => state.telemetryData,

    selectGPS: (state) => state.gpsData,
    selectHeading: (state) => (state.gpsData.hdg ? state.gpsData.hdg / 100 : 0),

    selectNavController: (state) => state.navControllerData,
    selectDesiredBearing: (state) => state.navControllerData.navBearing,

    selectHeartbeat: (state) => state.heartbeatData,
    selectArmed: (state) => state.heartbeatData.baseMode & 128,
    selectNotificationSound: (state) => state.notificationSound,
    selectFlightMode: (state) => state.heartbeatData.customMode,
    selectSystemStatus: (state) => MAV_STATE[state.heartbeatData.systemStatus],

    selectPrearmEnabled: (state) =>
      state.onboardControlSensorsEnabled & 268435456,

    selectGPSRawInt: (state) => state.gpsRawIntData,
    selectRSSI: (state) => state.rssi,
    selectAircraftType: (state) => state.aircraftType,
    selectBatteryData: (state) =>
      state.batteryData.sort((b1, b2) => b1.id - b2.id),

    selectExtraDroneData: (state) => state.extraDroneData,
    selectStatusText: (state) => state.statusText,
    selectGraphValues: (state) => state.graphs.selectedGraphs,
    selectLastGraphMessage: (state) => state.graphs.lastGraphResultsMessage,
  },
})

export const {
  setHeartbeatData,
  soundPlayed,
  changeExtraData,
  setExtraData,
  setDroneAircraftType,
  setTelemetryData,
  setGpsData,
  setAttitudeData,
  setNavControllerOutput,
  setGpsRawIntData,
  setBatteryData,
  setOnboardControlSensorsEnabled,
  setRSSIData,
  setGraphValues,
  setLastGraphMessage,
  setLoiterRadius,
} = droneInfoSlice.actions

// Memoized selectors because redux is a bitch
export const selectDroneCoords = createSelector(
  [droneInfoSlice.selectors.selectGPS],
  ({ lat, lon }) => {
    return { lat: lat * 1e-7, lon: lon * 1e-7 }
  },
)

export const selectAttitudeDeg = createSelector(
  [droneInfoSlice.selectors.selectAttitude],
  ({ roll, pitch, yaw }) => {
    return {
      roll: roll * (180 / Math.PI),
      pitch: pitch * (180 / Math.PI),
      yaw: yaw * (180 / Math.PI),
    }
  },
)

export const selectFlightModeString = createSelector(
  [
    droneInfoSlice.selectors.selectFlightMode,
    droneInfoSlice.selectors.selectAircraftType,
  ],
  (flightMode, aircraftType) => {
    //TODO: aircraftType should be in local storage apparently (for some reason?)
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[flightMode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[flightMode]
    }
    return "UNKNOWN"
  },
)

export const selectAlt = createSelector(
  [droneInfoSlice.selectors.selectGPS],
  ({ alt, relativeAlt }) => {
    return { alt: alt / 1000, relativeAlt: relativeAlt / 1000 }
  },
)

export const selectAircraftTypeString = createSelector(
  [droneInfoSlice.selectors.selectAircraftType],
  (aircraftType) => {
    switch (aircraftType) {
      case 1:
        return "Plane"
      case 2:
        return "Copter"
      default:
        return "Unknown"
    }
  },
)

export const {
  selectAttitude,
  selectTelemetry,
  selectGPS,
  selectNavController,
  selectDesiredBearing,
  selectHeartbeat,
  selectArmed,
  selectPrearmEnabled,
  selectGPSRawInt,
  selectRSSI,
  selectHeading,
  selectSystemStatus,
  selectNotificationSound,
  selectFlightMode,
  selectAircraftType,
  selectBatteryData,
  selectExtraDroneData,
  selectGraphValues,
  selectLastGraphMessage,
} = droneInfoSlice.selectors

export default droneInfoSlice
