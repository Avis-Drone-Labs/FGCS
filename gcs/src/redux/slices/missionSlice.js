import { createSlice } from "@reduxjs/toolkit";
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

        selectFilteredMissionItems: (state) => {
            return state.currentMissionItems.missionItems.filter((missionItem) =>
                !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
                    missionItem.command,
                ),
            )
        }

    }
})

export const {selectCurrentMission, selectCurrentMissionItems, selectFilteredMissionItems} = missionInfoSlice.selectors;
export const {setCurrentMission} = missionInfoSlice.actions

export default missionInfoSlice.reducer;
