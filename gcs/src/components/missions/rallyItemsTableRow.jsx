import { NumberInput, Select, TableTd, TableTr } from "@mantine/core"
import { useEffect, useState } from "react"
import { coordToInt, intToCoord } from "../../helpers/dataFormatters"
import { MAV_FRAME_LIST } from "../../helpers/mavlinkConstants"
const coordsFractionDigits = 9

export default function RallyItemsTableRow({
  index,
  rallyItem,
  updateRallyItem,
}) {
  const [rallyItemData, setRallyItemData] = useState(rallyItem)

  useEffect(() => {
    setRallyItemData(rallyItem)
  }, [rallyItem])

  useEffect(() => {
    updateRallyItem(rallyItemData)
  }, [rallyItemData])

  function getFrameName(frameId) {
    var frameName = MAV_FRAME_LIST[frameId]

    if (frameName.startsWith("MAV_FRAME_")) {
      frameName = frameName.replace("MAV_FRAME_", "")
    }

    return frameName || "UNKNOWN"
  }

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
          disabled
        />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param1} hideControls disabled />
      </TableTd>
      <TableTd>
        <NumberInput value={rallyItemData.param3} hideControls disabled />
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
      <TableTd>{getFrameName(rallyItemData.frame)}</TableTd>
    </TableTr>
  )
}
