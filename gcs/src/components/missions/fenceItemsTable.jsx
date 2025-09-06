/*
  This table displays all the fence items.
*/

import { Table } from "@mantine/core"
import React from "react"
import FenceItemsTableRow from "./fenceItemsTableRow"

// Redux
import { useSelector } from "react-redux"
import { selectDrawingFenceItems } from "../../redux/slices/missionSlice"

function FenceItemsTableNonMemo({ tableSectionHeight }) {
  const fenceItems = useSelector(selectDrawingFenceItems)

  return (
    <Table.ScrollContainer maxHeight={tableSectionHeight}>
      <Table striped withTableBorder withColumnBorders stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th>Command</Table.Th>
            <Table.Th>Param 1</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th>Lat</Table.Th>
            <Table.Th>Lng</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th>Frame</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fenceItems.map((fenceItem, idx) => {
            return (
              <FenceItemsTableRow key={fenceItem.id} fenceItemIndex={idx} />
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const FenceItemsTable = React.memo(FenceItemsTableNonMemo, propsAreEqual)

export default FenceItemsTable
