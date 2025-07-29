/*
  This table displays all the rally items.
*/
import { Table } from "@mantine/core"
import React from "react"
import RallyItemsTableRow from "./rallyItemsTableRow"

function RallyItemsTableNonMemo({ rallyItems, updateRallyItem }) {
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
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rallyItems.map((rallyItem, idx) => {
          return (
            <RallyItemsTableRow
              key={rallyItem.id}
              index={idx}
              rallyItem={rallyItem}
              updateRallyItem={updateRallyItem}
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
