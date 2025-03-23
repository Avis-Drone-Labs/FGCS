import { Table } from "@mantine/core"
import { intToCoord } from "../../helpers/dataFormatters"
import {
  COPTER_MISSION_ITEM_COMMANDS_LIST,
  PLANE_MISSION_ITEM_COMMANDS_LIST,
} from "../../helpers/mavlinkConstants"
import MissionItemsTableRow from "./missionItemsTableRow"

const coordsFractionDigits = 7

export default function MissionItemsTable({ missionItems, aircraftType }) {
  function getCommandName(commandId) {
    function getKeyByValue(object, value) {
      return Object.keys(object).find((key) => object[key] === value)
    }

    var commandName = "UNKNOWN"

    if (aircraftType === 1) {
      commandName = getKeyByValue(PLANE_MISSION_ITEM_COMMANDS_LIST, commandId)
    } else if (aircraftType === 2) {
      commandName = getKeyByValue(COPTER_MISSION_ITEM_COMMANDS_LIST, commandId)
    }

    if (commandName.startsWith("MAV_CMD_NAV_")) {
      commandName = commandName.replace("MAV_CMD_NAV_", "")
    } else if (commandName.startsWith("MAV_CMD_")) {
      commandName = commandName.replace("MAV_CMD_", "")
    }

    return commandName
  }
  return (
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Command</Table.Th>
          <Table.Th>Param 1</Table.Th>
          <Table.Th>Param 2</Table.Th>
          <Table.Th>Param 3</Table.Th>
          <Table.Th>Param 4</Table.Th>
          <Table.Th>Lat</Table.Th>
          <Table.Th>Long</Table.Th>
          <Table.Th>Alt</Table.Th>
          <Table.Th>Frame</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {missionItems.map((missionItem, idx) => {
          // Skip home location
          if (
            missionItem.command === 16 &&
            missionItem.frame === 0 &&
            missionItem.mission_type === 0
          ) {
            return null
          }

          return (
            <MissionItemsTableRow
              key={missionItem.id}
              index={idx}
              id={missionItem.id}
              command={getCommandName(missionItem.command)}
              frame={missionItem.frame}
              param1={missionItem.param1}
              param2={missionItem.param2}
              param3={missionItem.param3}
              param4={missionItem.param4}
              x={intToCoord(missionItem.x).toFixed(coordsFractionDigits)}
              y={intToCoord(missionItem.y).toFixed(coordsFractionDigits)}
              z={missionItem.z}
            />
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
