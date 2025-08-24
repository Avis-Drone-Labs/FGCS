/*
  This table displays all the rally items.
*/
import { Table } from "@mantine/core"
import React from "react"
import { useSelector } from "react-redux"
import { selectDrawingRallyItems } from "../../redux/slices/missionSlice"
import RallyItemsTableRow from "./rallyItemsTableRow"

function RallyItemsTableNonMemo({ updateRallyItem, deleteRallyItem }) {
  const rallyItems = useSelector(selectDrawingRallyItems)

  return (
    <Table striped withTableBorder withColumnBorders stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Command</Table.Th>
          <Table.Th></Table.Th>
          <Table.Th></Table.Th>
          <Table.Th></Table.Th>
          <Table.Th></Table.Th>
          <Table.Th>Lat</Table.Th>
          <Table.Th>Lng</Table.Th>
          <Table.Th>Alt</Table.Th>
          <Table.Th>Frame</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rallyItems.map((rallyItem) => {
          return (
            <RallyItemsTableRow
              key={rallyItem.id}
              rallyItem={rallyItem}
              updateRallyItem={updateRallyItem}
              deleteRallyItem={deleteRallyItem}
            />
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const RallyItemsTable = React.memo(RallyItemsTableNonMemo, propsAreEqual)

export default RallyItemsTable
