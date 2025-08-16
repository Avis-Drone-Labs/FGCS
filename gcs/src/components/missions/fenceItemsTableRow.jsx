/*
  This component displays the row for a fence item in a table.
*/

import {
  ActionIcon,
  NumberInput,
  Select,
  TableTd,
  TableTr,
} from "@mantine/core"
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { coordToInt, intToCoord } from "../../helpers/dataFormatters"
import {
  FENCE_ITEM_COMMANDS_LIST,
  MAV_FRAME_LIST,
} from "../../helpers/mavlinkConstants"

const coordsFractionDigits = 9

function getDisplayCommandName(commandName) {
  if (commandName.startsWith("MAV_CMD_NAV_")) {
    commandName = commandName.replace("MAV_CMD_NAV_", "")
  } else if (commandName.startsWith("MAV_CMD_")) {
    commandName = commandName.replace("MAV_CMD_", "")
  }

  return commandName
}

function getAvailableCommands() {
  var commandsList = FENCE_ITEM_COMMANDS_LIST

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

export default function FenceItemsTableRow({
  index,
  fenceItem,
  updateMissionItem,
  deleteMissionItem,
  updateMissionItemOrder,
}) {
  const [fenceItemData, setFenceItemData] = useState(fenceItem)

  useEffect(() => {
    setFenceItemData(fenceItem)
  }, [fenceItem])

  useEffect(() => {
    updateMissionItem(fenceItemData)
  }, [fenceItemData])

  function updateFenceItemData(key, newVal) {
    setFenceItemData({
      ...fenceItemData,
      [key]: newVal,
    })
  }

  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>
        <Select
          data={getAvailableCommands()}
          value={fenceItemData.command.toString()}
          onChange={(value) => updateFenceItemData("command", parseInt(value))}
          allowDeselect={false}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.param1}
          onChange={(val) => updateFenceItemData("param1", val)}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput value={fenceItemData.param2} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={fenceItemData.param3} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={fenceItemData.param4} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(fenceItemData.x).toFixed(coordsFractionDigits)}
          onChange={(val) => updateFenceItemData("x", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(fenceItemData.y).toFixed(coordsFractionDigits)}
          onChange={(val) => updateFenceItemData("y", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.z}
          onChange={(val) => updateFenceItemData("z", val)}
          hideControls
        />
      </TableTd>
      <TableTd>{getFrameName(fenceItemData.frame)}</TableTd>
      <TableTd className="flex flex-row gap-2">
        <ActionIcon
          onClick={() => updateMissionItemOrder(fenceItemData.id, -1)}
        >
          <IconArrowUp size={20} />
        </ActionIcon>
        <ActionIcon onClick={() => updateMissionItemOrder(fenceItemData.id, 1)}>
          <IconArrowDown size={20} />
        </ActionIcon>
        <ActionIcon
          onClick={() => deleteMissionItem(fenceItemData.id)}
          color="red"
        >
          <IconTrash size={20} />
        </ActionIcon>
      </TableTd>
    </TableTr>
  )
}
