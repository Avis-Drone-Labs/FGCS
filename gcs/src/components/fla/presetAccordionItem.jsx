/*
  Holds each element for the preset accordion including the buttons to select them.
  Preset Selection and Deletion logic is also handled here.
*/

// 3rd Party Imports
import {
  Accordion,
  Button,
  ActionIcon,
  Tooltip as MantineTooltip,
} from "@mantine/core"
import { IconTrash, IconInfoCircle } from "@tabler/icons-react"
import _ from "lodash"
import { colorPalette } from "./constants.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

import {
  queueErrorNotification,
  queueSuccessNotification,
} from "../../redux/slices/notificationSlice.js"
import {
  setMessageFilters,
  setCustomColors,
  setColorIndex,
  setCanSavePreset,

  // Selectors
  selectLogType,
  selectMessageFilters,
  selectAircraftType,
} from "../../redux/slices/logAnalyserSlice.js"
import { useSelector, useDispatch } from "react-redux"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Utility function to convert a string to title case
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

export default function PresetAccordionItem({ category, deleteCustomPreset }) {
  // Redux selectors
  const aircraftType = useSelector(selectAircraftType)

  // Redux state
  const dispatch = useDispatch()
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)

  // Redux dispatch functions
  const updateMessageFilters = (newMessageFilters) =>
    dispatch(setMessageFilters(newMessageFilters))
  const updateCustomColors = (newCustomColors) =>
    dispatch(setCustomColors(newCustomColors))
  const updateColorIndex = (newColorIndex) =>
    dispatch(setColorIndex(newColorIndex))
  const updateCanSavePreset = (newCanSavePreset) =>
    dispatch(setCanSavePreset(newCanSavePreset))
  const dispatchErrorNotification = (message) =>
    dispatch(queueErrorNotification(message))
  const dispatchSuccessNotification = (message) =>
    dispatch(queueSuccessNotification(message))

  // Preset selection
  function selectPreset(preset) {
    // Reset all filters
    let newFilters = _.cloneDeep(messageFilters)
    Object.keys(newFilters).forEach((categoryName) => {
      const category = newFilters[categoryName]
      Object.keys(category).forEach((fieldName) => {
        newFilters[categoryName][fieldName] = false
      })
    })
    let newColors = {}
    // Turn on filters for the given preset
    Object.keys(preset.filters).forEach((categoryName) => {
      if (Object.keys(messageFilters).includes(categoryName)) {
        preset.filters[categoryName].forEach((field) => {
          if (!(field in messageFilters[categoryName])) {
            dispatchErrorNotification(
              `Your log file does not include ${categoryName}/${field} data`,
            )
            return
          }
          newFilters[categoryName][field] = true

          // Assign a color
          if (!newColors[`${categoryName}/${field}`]) {
            newColors[`${categoryName}/${field}`] =
              colorPalette[Object.keys(newColors).length % colorPalette.length]
          }
        })
      } else {
        dispatchErrorNotification(
          `Your log file does not include ${categoryName}`,
        )
      }
    })

    updateColorIndex(Object.keys(newColors).length % colorPalette.length) // limited by palette length
    updateCustomColors(newColors)
    updateMessageFilters(newFilters)
    // Don't allow saving if we just selected an existing preset
    updateCanSavePreset(false)
  }

  function handleDeleteCustomPreset(presetName) {
    // Are there filters on screen?
    const hasSelectedFilters = Object.values(messageFilters).some((category) =>
      Object.values(category).some((isSelected) => isSelected),
    )

    // If so, check if they match the filters of the preset to be deleted
    if (hasSelectedFilters) {
      const filtersOfPresetToBeDeleted = (category?.presets || []).find(
        (preset) => preset.name === presetName,
      )?.filters
      if (!filtersOfPresetToBeDeleted) {
        deleteCustomPreset(presetName, logType)
        return
      }

      const activeMessageFields = Object.keys(messageFilters).reduce(
        (filteredCategories, category) => {
          const selectedFields = Object.keys(messageFilters[category]).filter(
            (field) => messageFilters[category][field] === true,
          )

          // Only add the category to the result if it has selected fields
          if (selectedFields.length > 0) {
            filteredCategories[category] = selectedFields
          }

          return filteredCategories
        },
        {},
      )
      const matchesSelectedPresets = _.isEqual(
        filtersOfPresetToBeDeleted,
        activeMessageFields,
      )

      if (matchesSelectedPresets) {
        updateCanSavePreset(true)
      }
    }

    deleteCustomPreset(presetName, logType)
    dispatchSuccessNotification(
      `Custom preset "${presetName}" deleted successfully`,
    )
  }

  // Filter out presets that don't match the current aircraft type
  const filteredPresets = category.presets.filter(
    (preset) =>
      preset.aircraftType === undefined ||
      preset.aircraftType.includes(aircraftType),
  )

  const isCustomPreset = category.name === "Custom Presets"

  return (
    <Accordion.Item value={category.name}>
      <Accordion.Control className="rounded-md">
        {category.name}
      </Accordion.Control>
      <Accordion.Panel>
        <div className="flex flex-col gap-2">
          {filteredPresets.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <IconInfoCircle size={20} />
              <p className="ml-2">
                No Saved {aircraftType ? toTitleCase(aircraftType) : ""}{" "}
                {isCustomPreset ? "Custom Preset" : "Preset"}
              </p>
            </div>
          ) : (
            filteredPresets.map((preset, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <MantineTooltip
                  label={
                    <p className="text-center text-wrap line-clamp-3 max-w-96">
                      {preset.name}
                    </p>
                  }
                  withArrow
                  position="right"
                  arrowSize={10}
                  arrowOffset={15}
                >
                  <Button
                    onClick={() => selectPreset(preset)}
                    className="flex-1"
                  >
                    <p className="text-wrap line-clamp-1">{preset.name}</p>
                  </Button>
                </MantineTooltip>

                {/* Add delete button if isCustomPreset */}
                {isCustomPreset && (
                  <MantineTooltip label="Delete Preset">
                    <ActionIcon
                      variant="light"
                      color={tailwindColors.red[500]}
                      onClick={() => handleDeleteCustomPreset(preset.name)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </MantineTooltip>
                )}
              </div>
            ))
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
