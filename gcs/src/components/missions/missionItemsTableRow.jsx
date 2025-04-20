import { NumberInput, Select, TableTd, TableTr } from "@mantine/core"
import { useEffect, useState } from "react"
import { coordToInt, intToCoord } from "../../helpers/dataFormatters"
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
    setMissionItemData(missionItem)
  }, [missionItem])

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

  function getFrameName(frameId) {
    var frameName = MAV_FRAME_LIST[frameId]

    if (frameName.startsWith("MAV_FRAME_")) {
      frameName = frameName.replace("MAV_FRAME_", "")
    }

    return frameName || "UNKNOWN"
  }

  function updateMissionItemData(key, newVal) {
    setMissionItemData({
      ...missionItemData,
      [key]: newVal,
    })
  }

  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>
        <Select
          data={getAvailableCommands()}
          value={missionItemData.command.toString()}
          onChange={(value) =>
            updateMissionItemData("command", parseInt(value))
          }
          allowDeselect={false}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItemData.param1}
          onChange={(val) => updateMissionItemData("param1", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItemData.param3}
          onChange={(val) => updateMissionItemData("param3", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItemData.param3}
          onChange={(val) => updateMissionItemData("param3", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItemData.param4}
          onChange={(val) => updateMissionItemData("param4", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(missionItemData.x).toFixed(coordsFractionDigits)}
          onChange={(val) => updateMissionItemData("x", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(missionItemData.y).toFixed(coordsFractionDigits)}
          onChange={(val) => updateMissionItemData("y", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItemData.z}
          onChange={(val) => updateMissionItemData("z", val)}
          hideControls
        />
      </TableTd>
      <TableTd>{getFrameName(missionItemData.frame)}</TableTd>
    </TableTr>
  )
}
