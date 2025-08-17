import { createSelector, createSlice } from "@reduxjs/toolkit"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_STATE,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../helpers/mavlinkConstants"
import { defaultDataMessages } from "../../helpers/dashboardDefaultDataMessages"

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
  },
  reducers: {
    setHeartbeatData: (state, action) => {
      if (
        action.payload.baseMode & 128 &&
        !(state.heartbeatData.baseMode & 128)
      )
        state.notificationSound = "armed"
      else if (
        !(action.payload.baseMode & 128) &&
        state.heartbeatData.baseMode & 128
      )
        state.notificationSound = "disarmed"
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
        state.gpsRawIntData = action.payload
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
  },
  selectors: {
    selectAttitude: (state) => state.attitudeData,
    selectTelemetry: (state) => state.telemetryData,

    selectGPS: (state) => state.gpsData,
    selectHeading: (state) => state.gpsData.hdg / 100,

    selectNavController: (state) => state.navControllerData,

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
  },
})

export const {
  setHeartbeatData,
  soundPlayed,
  changeExtraData,
  setDroneAircraftType,
  setTelemetryData,
  setGpsData,
  setAttitudeData,
  setNavControllerOutput,
  setGpsRawIntData,
  setBatteryData,
  setOnboardControlSensorsEnabled,
  setRSSIData,
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
  (roll, pitch, yaw) => {
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

// export function incomingMessageHandler(msg) {
//   switch (msg.mavpackettype) {
//     case "VFR_HUD":
//       console.log(msg)
//       setTelemetryData({ airspeed: msg.airspeed, groundspeed: msg.groundspeed });
//       break;
//   }
// VFR_HUD: (msg) => setTelemetryData(msg),
// BATTERY_STATUS: (msg) => {
//   const battery = localBatteryData.filter(
//     (battery) => battery.id == msg.id,
//   )[0]
//   if (battery) {
//     Object.assign(battery, msg)
//   } else {
//     localBatteryData.push(msg)
//   }
//   localBatteryData.sort((b1, b2) => b1.id - b2.id)
//   setBatteryData(localBatteryData)
// },
// ATTITUDE: (msg) => setAttitudeData(msg),
// GLOBAL_POSITION_INT: (msg) => setGpsData(msg),
// NAV_CONTROLLER_OUTPUT: (msg) => setNavControllerOutputData(msg),
// HEARTBEAT: (msg) => {
//   if (msg.autopilot !== MAV_AUTOPILOT_INVALID) {
//     setHeartbeatData(msg)
//   }
// },
// STATUSTEXT: (msg) => statustextMessagesHandler.prepend(msg),
// SYS_STATUS: (msg) => setSysStatusData(msg),
// GPS_RAW_INT: (msg) => setGpsRawIntData(msg),
// RC_CHANNELS: (msg) => setRCChannelsData(msg),
// MISSION_CURRENT: (msg) => setCurrentMissionData(msg),
// }

export const {
  selectAttitude,
  selectTelemetry,
  selectGPS,
  selectNavController,
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
} = droneInfoSlice.selectors

export default droneInfoSlice
