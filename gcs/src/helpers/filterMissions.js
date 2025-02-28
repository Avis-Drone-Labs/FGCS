import { FILTER_MISSION_ITEM_COMMANDS_LIST } from "./mavlinkConstants"

export function filterMissionItems(missionItems) {
  return missionItems.filter(
    (missionItem) =>
      !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
        missionItem.command,
      ),
  )
}
