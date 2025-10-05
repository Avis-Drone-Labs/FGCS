import { createSelector, createSlice } from "@reduxjs/toolkit"
import { defaultDataMessages } from "../../helpers/dashboardDefaultDataMessages"
import {
  getActiveEKFFlags,
  getFlightModeMap,
  MAV_STATE,
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
    homePosition: {
      lat: 0,
      lon: 0,
      alt: 0,
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
    guidedModePinData: {
      lat: 0, // Stored in coords not int
      lon: 0, // Stored in coords not int
      alt: 0,
    },
    ekfStatusReportData: {
      compass_variance: 0,
      pos_horiz_variance: 0,
      pos_vert_variance: 0,
      terrain_alt_variance: 0,
      velocity_variance: 0,
      flags: 0,
    },
    ekfCalculatedStatus: 0,
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
    setHomePosition: (state, action) => {
      if (action.payload !== state.homePosition) {
        state.homePosition = action.payload
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
    setGuidedModePinData: (state, action) => {
      state.guidedModePinData = action.payload
    },
    setEkfStatusReportData: (state, action) => {
      state.ekfStatusReportData = action.payload

      // Calculate EKF status value ranging from 0-1
      // https://github.com/ArduPilot/MissionPlanner/blob/4d441bd4b1dbc08adce4d8b26e078e93760da3a7/ExtLibs/ArduPilot/CurrentState.cs#L2645-L2647
      const vel = state.ekfStatusReportData.velocity_variance
      const comp = state.ekfStatusReportData.compass_variance
      const posHor = state.ekfStatusReportData.pos_horiz_variance
      const posVer = state.ekfStatusReportData.pos_vert_variance
      const terAlt = state.ekfStatusReportData.terrain_alt_variance
      state.ekfCalculatedStatus = Math.max(vel, comp, posHor, posVer, terAlt)

      // Check EKF flags to handle critical errors
      // https://github.com/ArduPilot/MissionPlanner/blob/4d441bd4b1dbc08adce4d8b26e078e93760da3a7/ExtLibs/ArduPilot/CurrentState.cs#L2674-L2736
      const activeFlags = getActiveEKFFlags(state.ekfStatusReportData.flags)
      if (!activeFlags.includes("EKF_ATTITUDE")) {
        // If we have no attitude solution
        state.ekfCalculatedStatus = 1
      } else if (!activeFlags.includes("EKF_VELOCITY_HORIZ")) {
        // If we have GPS but no horizontal velocity solution
        const gpsStatus = state.gpsRawIntData.fixType
        if (gpsStatus > 0) {
          state.ekfCalculatedStatus = 1
        }
      } else if (activeFlags.includes("EKF_UNINITIALIZED")) {
        // EKF not initialized at all
        state.ekfCalculatedStatus = 1
      }
    },
  },
  selectors: {
    selectAttitude: (state) => state.attitudeData,
    selectTelemetry: (state) => state.telemetryData,

    selectGPS: (state) => state.gpsData,
    selectHeading: (state) => (state.gpsData.hdg ? state.gpsData.hdg / 100 : 0),

    selectHomePosition: (state) => state.homePosition,

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

    selectGuidedModePinData: (state) => state.guidedModePinData,
    selectExtraDroneData: (state) => state.extraDroneData,
    selectStatusText: (state) => state.statusText,
    selectGraphValues: (state) => state.graphs.selectedGraphs,
    selectLastGraphMessage: (state) => state.graphs.lastGraphResultsMessage,
    selectEkfStatusReportData: (state) => state.ekfStatusReportData,
    selectEkfCalculatedStatus: (state) => state.ekfCalculatedStatus,
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
  setHomePosition,
  setAttitudeData,
  setNavControllerOutput,
  setGpsRawIntData,
  setBatteryData,
  setOnboardControlSensorsEnabled,
  setRSSIData,
  setGraphValues,
  setLastGraphMessage,
  setLoiterRadius,
  setGuidedModePinData,
  setEkfStatusReportData,
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

export const selectFlightModeString = createSelector(
  [droneInfoSlice.selectors.selectFlightMode, selectAircraftTypeString],
  (flightMode, aircraftType) => {
    //TODO: aircraftType should be in local storage apparently (for some reason?)
    const flightModeMap = getFlightModeMap(aircraftType)
    return flightModeMap[flightMode] || "UNKNOWN"
  },
)

export const {
  selectAttitude,
  selectTelemetry,
  selectGPS,
  selectHomePosition,
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
  selectGuidedModePinData,
  selectExtraDroneData,
  selectGraphValues,
  selectLastGraphMessage,
  selectEkfStatusReportData,
  selectEkfCalculatedStatus,
} = droneInfoSlice.selectors

export default droneInfoSlice
