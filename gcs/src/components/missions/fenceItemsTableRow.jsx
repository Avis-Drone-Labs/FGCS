/*
  This component displays the row for a fence item in a table.
*/

import { NumberInput, Select, TableTd, TableTr } from "@mantine/core"
import { useEffect, useState } from "react"
import { coordToInt, intToCoord } from "../../helpers/dataFormatters"
import { MAV_FRAME_LIST } from "../../helpers/mavlinkConstants"
const coordsFractionDigits = 9

export default function FenceItemsTableRow({
  index,
  fenceItem,
  updateFenceItem,
}) {
  const [fenceItemData, setFenceItemData] = useState(fenceItem)

  useEffect(() => {
    setFenceItemData(fenceItem)
  }, [fenceItem])

  useEffect(() => {
    updateFenceItem(fenceItemData)
  }, [fenceItemData])

  function getFrameName(frameId) {
    var frameName = MAV_FRAME_LIST[frameId]

    if (frameName.startsWith("MAV_FRAME_")) {
      frameName = frameName.replace("MAV_FRAME_", "")
    }

    return frameName || "UNKNOWN"
  }

  function updateFenceItemData(key, newVal) {
    setFenceItemData({
      ...fenceItemData,
      [key]: newVal,
    })
  }

  return (
    <TableTr>
      <TableTd>{index}</TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.command}
          onChange={(value) => updateFenceItemData("command", value)}
          min={0}
          max={65535}
          step={1}
          size="xs"
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.param1}
          onChange={(value) => updateFenceItemData("param1", value)}
          min={-1000}
          max={1000}
          step={0.1}
          size="xs"
          decimalScale={2}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.param2}
          onChange={(value) => updateFenceItemData("param2", value)}
          min={-1000}
          max={1000}
          step={0.1}
          size="xs"
          decimalScale={2}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.param3}
          onChange={(value) => updateFenceItemData("param3", value)}
          min={-1000}
          max={1000}
          step={0.1}
          size="xs"
          decimalScale={2}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.param4}
          onChange={(value) => updateFenceItemData("param4", value)}
          min={-1000}
          max={1000}
          step={0.1}
          size="xs"
          decimalScale={2}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.x}
          onChange={(value) => updateFenceItemData("x", value)}
          min={-90}
          max={90}
          step={0.0000001}
          size="xs"
          decimalScale={coordsFractionDigits}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.y}
          onChange={(value) => updateFenceItemData("y", value)}
          min={-180}
          max={180}
          step={0.0000001}
          size="xs"
          decimalScale={coordsFractionDigits}
        />
      </TableTd>
      <TableTd>
        <NumberInput
          value={fenceItemData.z}
          onChange={(value) => updateFenceItemData("z", value)}
          min={-1000}
          max={10000}
          step={0.1}
          size="xs"
          decimalScale={2}
        />
      </TableTd>
      <TableTd>
        <Select
          value={fenceItemData.frame}
          onChange={(value) => updateFenceItemData("frame", value)}
          data={Object.entries(MAV_FRAME_LIST).map(([key, value]) => ({
            value: key,
            label: value.replace("MAV_FRAME_", ""),
          }))}
          size="xs"
        />
      </TableTd>
    </TableTr>
  )
}
