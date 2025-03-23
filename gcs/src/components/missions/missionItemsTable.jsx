import { Table } from "@mantine/core";

export default function MissionItemsTable({missionItems}) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Frame</Table.Th>
          <Table.Th>Command</Table.Th>
          <Table.Th>Param 1</Table.Th>
          <Table.Th>Param 2</Table.Th>
          <Table.Th>Param 3</Table.Th>
          <Table.Th>Param 4</Table.Th>
          <Table.Th>Param 5</Table.Th>
          <Table.Th>Param 6</Table.Th>
          <Table.Th>Param 7</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {/* Add mission items here */}
      </Table.Tbody>
    </Table>
  )
}