/*
  This table displays all the fence items.
*/
import { Table } from "@mantine/core"
import React from "react"
import FenceItemsTableRow from "./fenceItemsTableRow"

function FenceItemsTableNonMemo({ fenceItems, updateFenceItem }) {
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
        {fenceItems.map((fenceItem, idx) => {
          return (
            <FenceItemsTableRow
              key={fenceItem.id}
              index={idx}
              fenceItem={fenceItem}
              updateFenceItem={updateFenceItem}
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
const FenceItemsTable = React.memo(FenceItemsTableNonMemo, propsAreEqual)

export default FenceItemsTable
