/*
A custom component for each message card (seen at the bottom of the screen on FLA).
This holds information about the colour of the line, and its mean, max, min.
*/

import { colorInputSwatch } from "./constants.js"

// 3rd Party Imports
import { ActionIcon, Box, ColorInput } from "@mantine/core"
import { IconPaint, IconTrash } from "@tabler/icons-react"
import { useDispatch, useSelector } from "react-redux"

// Redux imports
import {
  selectCustomColors,
  selectMessageFilters,
  setCanSavePreset,
  setCustomColors,
  setMessageFilters,
} from "../../redux/slices/logAnalyserSlice.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function ChartDataCard({ item, unit, messageMeans }) {
  const dispatch = useDispatch()
  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)

  // Change the color of the line
  function changeColor(label, color) {
    let newColors = structuredClone(customColors)
    newColors[label] = color
    dispatch(setCustomColors(newColors))
  }

  // Turn off only one filter at a time
  function removeDataset(label) {
    let [categoryName, fieldName] = label.split("/")
    let newFilters = structuredClone(messageFilters)
    if (
      newFilters[categoryName] &&
      newFilters[categoryName][fieldName] !== undefined
    ) {
      newFilters[categoryName][fieldName] = false
    }
    let newColors = structuredClone(customColors)
    delete newColors[label]
    dispatch(setCustomColors(newColors))
    dispatch(setMessageFilters(newFilters))
    if (Object.keys(newColors).length === 0) {
      dispatch(setCanSavePreset(false))
    } else {
      dispatch(setCanSavePreset(true))
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-2 px-2 py-2 mr-3 text-xs font-bold text-white border border-gray-700 rounded-lg bg-grey-200">
      {/* Title and Delete Button */}
      <div className="inline-flex items-center content-center justify-between w-full">
        <p className="text-md">
          {item.label} <span className="text-gray-400">({unit})</span>
        </p>
        <ActionIcon
          variant="subtle"
          color={tailwindColors.red[500]}
          onClick={() => removeDataset(item.label)}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </div>

      {/* Color Selector */}
      <ColorInput
        className="w-full text-xs"
        size="xs"
        format="hex"
        swatches={colorInputSwatch}
        closeOnColorSwatchClick
        withEyeDropper={false}
        value={item.borderColor}
        rightSection={<IconPaint size={16} />}
        onChangeEnd={(color) => changeColor(item.label, color)}
      />

      {/* Min, max, min */}
      <Box className="w-full text-gray-400">
        Min: {messageMeans[item.label]?.min}, Max:{" "}
        {messageMeans[item.label]?.max}, Mean: {messageMeans[item.label]?.mean}
      </Box>
    </div>
  )
}
