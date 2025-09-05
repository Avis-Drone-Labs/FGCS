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
import { useDispatch, useSelector } from "react-redux"
import {
  coordToInt,
  getPositionFrameName,
  intToCoord,
} from "../../helpers/dataFormatters"
import {
  removeDrawingItem,
  selectDrawingRallyItemByIdx,
  updateDrawingItem,
} from "../../redux/slices/missionSlice"
const coordsFractionDigits = 9

export default function RallyItemsTableRow({ rallyItemIndex }) {
  const dispatch = useDispatch()
  const rallyItem = useSelector(selectDrawingRallyItemByIdx(rallyItemIndex))

  function updateRallyItemData(key, newVal) {
    dispatch(
      updateDrawingItem({
        ...rallyItem,
        [key]: newVal,
      }),
    )
  }

  return (
    <TableTr>
      <TableTd>{rallyItem.seq}</TableTd>
      <TableTd>
        <Select
          data={[{ value: "5100", label: "RALLY_POINT" }]}
          value={"5100"}
          allowDeselect={false}
          disabled
        />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItem.param1} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItem.param2} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItem.param3} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItem.param4} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(rallyItem.x).toFixed(coordsFractionDigits)}
          onChange={(val) => updateRallyItemData("x", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={intToCoord(rallyItem.y).toFixed(coordsFractionDigits)}
          onChange={(val) => updateRallyItemData("y", coordToInt(val))}
          hideControls
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={rallyItem.z}
          onChange={(val) => updateRallyItemData("z", val)}
          hideControls
        />
      </TableTd>
      <TableTd>{getPositionFrameName(rallyItem.frame)}</TableTd>
      <TableTd>
        <ActionIcon
          onClick={() => dispatch(removeDrawingItem(rallyItem.id))}
          color="red"
        >
          <IconTrash size={20} />
        </ActionIcon>
      </TableTd>
    </TableTr>
  )
}
