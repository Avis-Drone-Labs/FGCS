/*
  This table displays all the mission items.
*/

import { Table } from "@mantine/core"
import React from "react"
import { isGlobalFrameHomeCommand } from "../../helpers/filterMissions"
import MissionItemsTableRow from "./missionItemsTableRow"

// Redux
import { useSelector } from "react-redux"
import { selectDrawingMissionItems } from "../../redux/slices/missionSlice"

function MissionItemsTableNonMemo() {
  const missionItems = useSelector(selectDrawingMissionItems)

  return (
    <Table striped withTableBorder withColumnBorders stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Command</Table.Th>
          <Table.Th>Param 1</Table.Th>
          <Table.Th>Param 2</Table.Th>
          <Table.Th>Param 3</Table.Th>
          <Table.Th>Param 4</Table.Th>
          <Table.Th>Lat</Table.Th>
          <Table.Th>Lng</Table.Th>
          <Table.Th>Alt</Table.Th>
          <Table.Th>Frame</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {missionItems.map((missionItem, idx) => {
          // Skip home location
          if (idx === 0 && isGlobalFrameHomeCommand(missionItem)) {
            return null
          }

          return (
            <MissionItemsTableRow key={missionItem.id} missionItemIndex={idx} />
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const MissionItemsTable = React.memo(MissionItemsTableNonMemo, propsAreEqual)

export default MissionItemsTable
