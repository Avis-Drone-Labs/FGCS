import { createSlice } from "@reduxjs/toolkit";
import { COPTER_MODES_FLIGHT_MODE_MAP, GPS_FIX_TYPES, MAV_STATE, PLANE_MODES_FLIGHT_MODE_MAP } from "../../helpers/mavlinkConstants";
import { defaultDataMessages } from "../../helpers/dashboardDefaultDataMessages";

const droneInfoSlice = createSlice({
    name: "droneInfo",
    initialState: {
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
            hdg: 0.0,
            alt: 0.0,
            relativeAlt: 0.0
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
        rssi: 0.0,
        notificationSound: "",
        aircraftType: 1, // TODO: This should be in local storage but I have no idea how :D,
        batteryData: [],
        extraDroneData: {
            ...defaultDataMessages // TODO: Should also be stored in local storage, values set to 0 on launch but actual messages stored
        }
    },
    reducers: {
        setHeartbeatData: (state, action) => {
            if (action.payload.baseMode & 128 && !(state.heartbeatData.baseMode & 128))
                state.notificationSound = "armed"
            else if (!(action.payload.baseMode & 128) && state.heartbeatData.baseMode & 128)
                state.notificationSound = "disarmed"
        },
        setBatteryData: (state, action) => {
            const battery = state.batteryData.filter(battery => battery.id == action.payload.id)[0]
            if (battery) {
                Object.assign(battery, action.payload)
            } else {
                state.batteryData.push(action.payload)
            }
        },
        soundPlayed: (state) => {
            state.notificationSound = "";
        },
        changeExtraData: (state, action) => {
            state.extraDroneData[action.payload.index] = {...state.extraDroneData[action.payload.index], ...action.payload.data}
        }
    },
    selectors: {
        selectAttitude: (state) => state.attitudeData,
        selectAttitudeDeg: (state) => {
            return {roll: state.attitudeData.roll * (180 / Math.PI),
                    lon: state.attitudeData.lon * (180 / Math.PI),
                    yaw: state.attitudeData.yaw * (180 / Math.PI)};
        },
        selectTelemetry: (state) => state.telemetryData,

        selectGPS: (state) => {
            return {...(state.gpsData), hdg: state.gpsData.hdg / 100};
        },
        selectDroneCoords: (state) => {
            return {lat: state.gpsData.lat * 1e-7, lon: state.gpsData.lon * 1e-7};
        },
        selectHeading: (state) => state.gpsData.hdg / 100,
        selectAlt: (state) => {
            return {alt: state.gpsData.alt / 1000, relativeAlt: state.gpsData.relativeAlt / 1000}
        },

        selectNavController: (state) => state.navControllerData,

        selectHeartbeat: (state) => state.heartbeatData,
        selectArmed: (state) => state.heartbeatData.baseMode & 128,
        selectNotificationSound: (state) => state.notificationSound,
        selectFlightModeString: (state) => {
            //TODO: aircraftType should be in local storage apparently (for some reason?)
            if (state.aircraftType === 1) {
                return PLANE_MODES_FLIGHT_MODE_MAP[state.heartbeatData.customMode]
            } else if (state.aircraftType === 2) {
                return COPTER_MODES_FLIGHT_MODE_MAP[state.heartbeatData.customMode]
            }
            return "UNKNOWN"
        },
        selectFlightMode: (state) => state.heartbeatData.customMode,
        selectSystemStatus: (state) => MAV_STATE[state.heartbeatData.systemStatus],

        selectPrearmEnabled: (state) => state.onboardControlSensorsEnabled & 268435456,


        selectGPSRawInt: (state) => {
            return {...state.gpsRawIntData, fixType: GPS_FIX_TYPES[state.gpsRawIntData.fixType]};
        },
        selectRSSI: (state) => state.rssi,
        selectAircraftType: (state) => state.aircraftType,
        selectBatteryData: (state) => state.batteryData.sort((b1, b2) => b1.id - b2.id),

        selectExtraDroneData: (state) => state.extraDroneData,
    }
})

export const {setHeartbeatData, soundPlayed, changeExtraData} = droneInfoSlice.actions;

export const { selectAttitude,
            selectTelemetry,
            selectGPS,
            selectNavController,
            selectHeartbeat,
            selectArmed,
            selectPrearmEnabled,
            selectGPSRawInt,
            selectRSSI,
            selectAttitudeDeg,
            selectDroneCoords,
            selectHeading,
            selectSystemStatus,
            selectAlt,
            selectFlightModeString,
            selectNotificationSound,
            selectFlightMode,
            selectAircraftType,
            selectBatteryData,
            selectExtraDroneData } = droneInfoSlice.selectors;

export default droneInfoSlice.reducer;
