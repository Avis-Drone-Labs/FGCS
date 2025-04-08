import { createSelector, createSlice } from "@reduxjs/toolkit";
import { COPTER_MODES_FLIGHT_MODE_MAP, MAV_STATE, PLANE_MODES_FLIGHT_MODE_MAP } from "../../helpers/mavlinkConstants";
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
        selectTelemetry: (state) => state.telemetryData,

        selectGPS: (state) => state.gpsData,
        selectHeading: (state) => state.gpsData.hdg / 100,

        selectNavController: (state) => state.navControllerData,

        selectHeartbeat: (state) => state.heartbeatData,
        selectArmed: (state) => state.heartbeatData.baseMode & 128,
        selectNotificationSound: (state) => state.notificationSound,
        selectFlightMode: (state) => state.heartbeatData.customMode,
        selectSystemStatus: (state) => MAV_STATE[state.heartbeatData.systemStatus],

        selectPrearmEnabled: (state) => state.onboardControlSensorsEnabled & 268435456,


        selectGPSRawInt: (state) => state.gpsRawIntData,
        selectRSSI: (state) => state.rssi,
        selectAircraftType: (state) => state.aircraftType,
        selectBatteryData: (state) => state.batteryData.sort((b1, b2) => b1.id - b2.id),

        selectExtraDroneData: (state) => state.extraDroneData,
    }
})

export const {setHeartbeatData, soundPlayed, changeExtraData} = droneInfoSlice.actions;

// Memoized selectors because redux is a bitch
export const selectDroneCoords = createSelector([droneInfoSlice.selectors.selectGPS], ({lat, lon}) =>  {return {lat: lat * 1e-7, lon: lon * 1e-7}})

export const selectAttitudeDeg = createSelector([droneInfoSlice.selectors.selectAttitude], (roll, pitch, yaw) => {
            return {roll: roll * (180 / Math.PI), pitch: pitch * (180 / Math.PI), yaw: yaw * (180 / Math.PI)};
})

export const selectFlightModeString = createSelector([droneInfoSlice.selectors.selectFlightMode, droneInfoSlice.selectors.selectAircraftType],
    (flightMode, aircraftType) => {
        //TODO: aircraftType should be in local storage apparently (for some reason?)
        if (aircraftType === 1) {
            return PLANE_MODES_FLIGHT_MODE_MAP[flightMode]
        } else if (aircraftType === 2) {
            return COPTER_MODES_FLIGHT_MODE_MAP[flightMode]
        }
        return "UNKNOWN"
    }
)

export const selectAlt = createSelector([droneInfoSlice.selectors.selectGPS], ({alt, relativeAlt}) => {
    return {alt: alt / 1000, relativeAlt: relativeAlt / 1000}
})

export const { selectAttitude,
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
            selectExtraDroneData } = droneInfoSlice.selectors;


export default droneInfoSlice
