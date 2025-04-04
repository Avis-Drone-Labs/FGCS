import { createSlice } from "@reduxjs/toolkit";
import { GPS_FIX_TYPES } from "../../helpers/mavlinkConstants";

const droneInfoSlice = createSlice({
    name: "droneInfo",
    initalState: {
        attitudeData: {
            roll: 0.0,
            pitch: 0.0,
            yaw: 0.0
        },
        telemetryData: {
            airspeed: 0.0,
            groundspeed: 0.0
        },
        gpsData: {
            lat: 0.0,
            lon: 0.0,
            hdg: 0.0
        },
        navControllerData: {
            navBearing: 0.0,
            wpDist: 0.0
        },
        heartbeatData: {
            baseMode: 0,
            customMode: 0,
            systemStatus: 0
        },
        onboardControlSensorsEnabled: 0,
        gpsRawIntData: {
            fixType: 0,
            satellitesVisible: 0
        },
        rssi: 0.0
    },
    reducers: {

    },
    selectors: {
        selectAttitude: (state) => state.attitudeData,
        selectTelemetry: (state) => state.telemetryData,
        selectGPS: (state) => {
            return {...(state.gpsData), hdg: state.gpsData.hdg / 100};
        },
        selectNavController: (state) => state.navControllerData,

        selectHeartbeat: (state) => state.heartbeatData,

        selectPrearmEnabled: (state) => state.onboardControlSensorsEnabled & 268435456,

        selectGPSRawInt: (state) => {
            return {...state.gpsRawIntData, fixType: GPS_FIX_TYPES[state.gpsRawIntData.fixType]};
        },
        selectRSSI: (state) => state.rssi
    }
})

export const { selectAttitude, selectTelemetry, selectGPS, selectNavController, selectHeartbeat, selectPrearmEnabled, selectGPSRawInt, selectRSSI } = droneInfoSlice.selectors;