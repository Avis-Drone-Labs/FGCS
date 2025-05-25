import { FILTER_MISSION_ITEM_COMMANDS_LIST } from "./mavlinkConstants"

export function filterMissionItems(missionItems) {
  const filteredMissionItems = []

  for (const missionItem of missionItems) {
    if (
      !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
        missionItem.command,
      ) &&
      !(
        // If loiter command and no coordinates then filter out
        (
          [17, 18, 19].includes(missionItem.command) &&
          missionItem.x === 0 &&
          missionItem.y === 0
        )
      )
    ) {
      filteredMissionItems.push(missionItem)
    }
  }

  return filteredMissionItems
}
