import {
  FILTER_MISSION_ITEM_COMMANDS_LIST,
  MAV_FRAME_LIST,
} from "./mavlinkConstants"

export function filterMissionItems(missionItems) {
  const filteredMissionItems = []

  if (missionItems !== undefined) {
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
  }

  return filteredMissionItems
}

export function isGlobalFrameHomeCommand(waypoint) {
  const globalFrameValue = parseInt(
    Object.keys(MAV_FRAME_LIST).find(
      (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL",
    ),
  )
  return (
    waypoint.frame === globalFrameValue &&
    waypoint.x !== 0 &&
    waypoint.y !== 0 &&
    waypoint.command === 16
  )
}
