import { Select, TableTd, TableTr } from "@mantine/core"
import { useEffect, useState } from "react"
import { intToCoord } from "../../helpers/dataFormatters"
import {
  COPTER_MISSION_ITEM_COMMANDS_LIST,
  MAV_FRAME_LIST,
  PLANE_MISSION_ITEM_COMMANDS_LIST,
} from "../../helpers/mavlinkConstants"

const coordsFractionDigits = 9

export default function MissionItemsTableRow({
  index,
  aircraftType,
  missionItem,
  updateMissionItem,
}) {
  const [missionItemData, setMissionItemData] = useState(missionItem)

  useEffect(() => {
    updateMissionItem(missionItemData)
  }, [missionItemData])

  function getDisplayCommandName(commandName) {
    if (commandName.startsWith("MAV_CMD_NAV_")) {
      commandName = commandName.replace("MAV_CMD_NAV_", "")
    } else if (commandName.startsWith("MAV_CMD_")) {
      commandName = commandName.replace("MAV_CMD_", "")
    }

    return commandName
  }

  function getAvailableCommands() {
    var commandsList = COPTER_MISSION_ITEM_COMMANDS_LIST
    if (aircraftType === 1) {
      commandsList = PLANE_MISSION_ITEM_COMMANDS_LIST
    }

    return Object.entries(commandsList).map(([key, value]) => ({
      value: key,
      label: getDisplayCommandName(value),
    }))
  }

  function getCommandName(commandId) {
    var commandName = "UNKNOWN"

    if (aircraftType === 1) {
      commandName = PLANE_MISSION_ITEM_COMMANDS_LIST[commandId]
    } else if (aircraftType === 2) {
      commandName = COPTER_MISSION_ITEM_COMMANDS_LIST[commandId]
    }

    return getDisplayCommandName(commandName)
  }

  function getFrameName(frameId) {
    var frameName = MAV_FRAME_LIST[frameId]

    if (frameName.startsWith("MAV_FRAME_")) {
      frameName = frameName.replace("MAV_FRAME_", "")
    }

    return frameName || "UNKNOWN"
  }

  function updateCommand(newCommand) {
    setMissionItemData({
      ...missionItemData,
      command: parseInt(newCommand),
    })
  }

  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>
        <Select
          data={getAvailableCommands()}
          value={missionItemData.command.toString()}
          onChange={(value) => updateCommand(value)}
        />
      </TableTd>
      <TableTd>{missionItemData.param1}</TableTd>
      <TableTd>{missionItemData.param2}</TableTd>
      <TableTd>{missionItemData.param3}</TableTd>
      <TableTd>{missionItemData.param4}</TableTd>
      <TableTd>
        {intToCoord(missionItemData.x).toFixed(coordsFractionDigits)}
      </TableTd>
      <TableTd>
        {intToCoord(missionItemData.y).toFixed(coordsFractionDigits)}
      </TableTd>
      <TableTd>{missionItemData.z}</TableTd>
      <TableTd>{getFrameName(missionItemData.frame)}</TableTd>
    </TableTr>
  )
}
