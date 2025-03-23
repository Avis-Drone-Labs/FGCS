import { TableTd, TableTr } from "@mantine/core"

export default function MissionItemsTableRow({
  index,
  id,
  command,
  frame,
  param1,
  param2,
  param3,
  param4,
  x,
  y,
  z,
}) {
  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>{command}</TableTd>
      <TableTd>{param1}</TableTd>
      <TableTd>{param2}</TableTd>
      <TableTd>{param3}</TableTd>
      <TableTd>{param4}</TableTd>
      <TableTd>{x}</TableTd>
      <TableTd>{y}</TableTd>
      <TableTd>{z}</TableTd>
      <TableTd>{frame}</TableTd>
    </TableTr>
  )
}
