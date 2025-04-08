import { createSelector, createSlice } from "@reduxjs/toolkit";
import { FILTER_MISSION_ITEM_COMMANDS_LIST } from "../../helpers/mavlinkConstants";

const missionInfoSlice = createSlice({
    name: "missionInfo",
    initialState: {
        currentMission: {
            missionState: 0,
            total: 0,
            seq: 0
        },
        currentMissionItems: {
            missionItems: [],
            fenceItems: [],
            rallyItems: []
        }
    },
    reducers: {
        setCurrentMission: (state, action) => {
            state.currentMission = action.payload;
        },
        // TODO: on socket.on(current_mission)
        setCurrentMissionItems: (state, action) => {
            state.currentMissionItems = action.payload;
        }
    },
    selectors: {
        selectCurrentMission: (state) => state.currentMission,
        selectCurrentMissionItems: (state) => state.currentMissionItems,
    }
})

// Memoization because redux doesn't like me
export const selectFilteredMissionItems = createSelector([missionInfoSlice.selectors.selectCurrentMissionItems], ({missionItems}) => {

    return missionItems.filter((missionItem) =>
        !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
            missionItem.command,
        ),
    )
})

export const {selectCurrentMission, selectCurrentMissionItems} = missionInfoSlice.selectors;
export const {setCurrentMission} = missionInfoSlice.actions

export default missionInfoSlice
