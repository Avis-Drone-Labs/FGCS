/*
  This component displays the row for a rally item in a table.
*/

import {
  ActionIcon,
  NumberInput,
  Select,
  TableTd,
  TableTr,
} from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import {
  coordToInt,
  getPositionFrameName,
  intToCoord,
} from "../../helpers/dataFormatters"
const coordsFractionDigits = 9

export default function RallyItemsTableRow({
  index,
  rallyItem,
  updateRallyItem,
  deleteRallyItem,
}) {
  const [rallyItemData, setRallyItemData] = useState(rallyItem)

  useEffect(() => {
    setRallyItemData(rallyItem)
  }, [rallyItem])

  useEffect(() => {
    if (rallyItem !== rallyItemData) {
      updateRallyItem(rallyItemData)
    }
  }, [rallyItemData])

  function updateRallyItemData(key, newVal) {
    setRallyItemData({
      ...rallyItemData,
      [key]: newVal,
    })
  }

  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>
        <Select
          data={[{ value: "5100", label: "RALLY_POINT" }]}
          value={"5100"}
          allowDeselect={false}
          disabled
        />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param1} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param2} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param3} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param4} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(rallyItemData.x).toFixed(coordsFractionDigits)}
          onChange={(val) => updateRallyItemData("x", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(rallyItemData.y).toFixed(coordsFractionDigits)}
          onChange={(val) => updateRallyItemData("y", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={rallyItemData.z}
          onChange={(val) => updateRallyItemData("z", val)}
          hideControls
        />
      </TableTd>
      <TableTd>{getPositionFrameName(rallyItemData.frame)}</TableTd>
      <TableTd>
        <ActionIcon
          onClick={() => deleteRallyItem(rallyItemData.id)}
          color="red"
        >
          <IconTrash size={20} />
        </ActionIcon>
      </TableTd>
    </TableTr>
  )
}
