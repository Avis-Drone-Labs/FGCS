import { createSelector, createSlice } from "@reduxjs/toolkit"
import { FILTER_MISSION_ITEM_COMMANDS_LIST } from "../../helpers/mavlinkConstants"

const missionInfoSlice = createSlice({
  name: "missionInfo",
  initialState: {
    currentMission: {
      mission_state: 0,
      total: 0,
      seq: 0,
    },
    currentMissionItems: {
      // These should be camelCase etc but its easier to keep it as snake_case
      mission_items: [],
      fence_items: [],
      rally_items: [],
    },
    homePosition: {
      lat: 0,
      lon: 0,
      alt: 0,
    },
  },
  reducers: {
    setCurrentMission: (state, action) => {
      if (action.payload === state.currentMission) return
      state.currentMission = action.payload
    },
    setCurrentMissionItems: (state, action) => {
      if (
        action.payload === state.currentMissionItems ||
        action.payload == undefined
      )
        return
      state.currentMissionItems = action.payload
    },
    setHomePosition: (state, action) => {
      if (action.payload === state.homePosition) return
      state.homePosition = action.payload
    },
  },
  selectors: {
    selectCurrentMission: (state) => state.currentMission,
    selectCurrentMissionItems: (state) => state.currentMissionItems,
    selectHomePosition: (state) => state.homePosition,
  },
})

// Memoization because redux doesn't like me
export const selectFilteredMissionItems = createSelector(
  [missionInfoSlice.selectors.selectCurrentMissionItems],
  ({ missionItems }) => {
    return missionItems.filter(
      (missionItem) =>
        !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
          missionItem.command,
        ),
    )
  },
)

export const {
  selectCurrentMission,
  selectCurrentMissionItems,
  selectHomePosition,
} = missionInfoSlice.selectors
export const { setCurrentMission, setCurrentMissionItems, setHomePosition } =
  missionInfoSlice.actions

export default missionInfoSlice
