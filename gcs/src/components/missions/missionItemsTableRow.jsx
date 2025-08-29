/*
  This component displays the row for a mission item in a table.
*/

import {
  ActionIcon,
  NumberInput,
  Select,
  TableTd,
  TableTr,
} from "@mantine/core"
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react"
import {
  coordToInt,
  getPositionFrameName,
  intToCoord,
} from "../../helpers/dataFormatters"
import {
  COPTER_MISSION_ITEM_COMMANDS_LIST,
  PLANE_MISSION_ITEM_COMMANDS_LIST,
} from "../../helpers/mavlinkConstants"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  removeDrawingItem,
  reorderDrawingItem,
  selectDrawingMissionItemByIdx,
  updateDrawingItem,
} from "../../redux/slices/missionSlice"

const coordsFractionDigits = 9

export default function MissionItemsTableRow({ missionItemIndex }) {
  const dispatch = useDispatch()
  const aircraftType = useSelector(selectAircraftType)
  const missionItem = useSelector(
    selectDrawingMissionItemByIdx(missionItemIndex),
  )

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

  function updateMissionItemData(key, newVal) {
    dispatch(
      updateDrawingItem({
        ...missionItem,
        [key]: newVal,
      }),
    )
  }

  console.log(missionItem, missionItemIndex)

  return (
    <TableTr>
      <TableTd>{missionItem.seq}</TableTd>
      <TableTd>
        <Select
          data={getAvailableCommands()}
          value={missionItem.command.toString()}
          onChange={(value) =>
            updateMissionItemData("command", parseInt(value))
          }
          allowDeselect={false}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItem.param1}
          onChange={(val) => updateMissionItemData("param1", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItem.param2}
          onChange={(val) => updateMissionItemData("param2", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItem.param3}
          onChange={(val) => updateMissionItemData("param3", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItem.param4}
          onChange={(val) => updateMissionItemData("param4", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(missionItem.x).toFixed(coordsFractionDigits)}
          onChange={(val) => updateMissionItemData("x", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(missionItem.y).toFixed(coordsFractionDigits)}
          onChange={(val) => updateMissionItemData("y", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={missionItem.z}
          onChange={(val) => updateMissionItemData("z", val)}
          hideControls
        />
      </TableTd>
      <TableTd>{getPositionFrameName(missionItem.frame)}</TableTd>
      <TableTd className="flex flex-row gap-2">
        <ActionIcon
          onClick={() =>
            dispatch(reorderDrawingItem({ id: missionItem.id, increment: -1 }))
          }
        >
          <IconArrowUp size={20} />
        </ActionIcon>
        <ActionIcon
          onClick={() =>
            dispatch(reorderDrawingItem({ id: missionItem.id, increment: 1 }))
          }
        >
          <IconArrowDown size={20} />
        </ActionIcon>
        <ActionIcon
          onClick={() => dispatch(removeDrawingItem(missionItem.id))}
          color="red"
        >
          <IconTrash size={20} />
        </ActionIcon>
      </TableTd>
    </TableTr>
  )
}
