/*
  MessagesFiltersAccordion
  Renders the list of log message accordions with checkboxes that control whether or
  not they show on the graph.
  This also contains the descriptions of all log messages from helpers.
*/

// 3rd Party Imports
import { Accordion, Checkbox } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import _ from "lodash"

// Helper imports
import { logMessageDescriptions } from "../../helpers/logMessageDescriptions.js"

// Local imports
import { colorPalette } from "./constants.js"
import {
  selectMessageFilters,
  selectCustomColors,
  selectColorIndex,
  setMessageFilters,
  setCustomColors,
  setColorIndex,
  setCanSavePreset,
} from "../../redux/slices/logAnalyserSlice.js"

export default function MessagesFiltersAccordion() {
  const dispatch = useDispatch()

  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)
  const colorIndex = useSelector(selectColorIndex)

  const updateMessageFilters = (filters) => {
    dispatch(setMessageFilters(filters))
  }
  const updateCustomColors = (colors) => {
    dispatch(setCustomColors(colors))
  }
  const updateColorIndex = (index) => {
    dispatch(setColorIndex(index))
  }
  const updateCanSavePreset = (canSave) => {
    dispatch(setCanSavePreset(canSave))
  }

  if (!messageFilters) return null

  function selectMessageFilter(event, messageName, fieldName) {
    let newFilters = _.cloneDeep(messageFilters)
    let newColors = _.cloneDeep(customColors)

    const checked = event.currentTarget.checked
    newFilters[messageName][fieldName] = checked

    if (!checked) {
      delete newColors[`${messageName}/${fieldName}`]
    } else {
      if (!newColors[`${messageName}/${fieldName}`]) {
        newColors[`${messageName}/${fieldName}`] =
          colorPalette[colorIndex % colorPalette.length]
        updateColorIndex((colorIndex + 1) % colorPalette.length)
      }
    }

    updateCustomColors(newColors)
    updateMessageFilters(newFilters)

    // Then check if we should allow saving preset
    // Only enable save if there are selected filters
    const hasSelectedFilters = Object.values(newFilters).some((category) =>
      Object.values(category).some((isSelected) => isSelected),
    )
    updateCanSavePreset(hasSelectedFilters)
  }

  return (
    <Accordion multiple={true}>
      {Object.keys(messageFilters).map((messageName) => (
        <Accordion.Item value={messageName} key={messageName}>
          <Accordion.Control className="rounded-md">
            <p>{messageName}</p>
            <p className="text-sm italic text-gray-500">
              {logMessageDescriptions[messageName]}
            </p>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-1">
              {Object.keys(messageFilters[messageName]).map((fieldName) => (
                <Checkbox
                  key={`${messageName}/${fieldName}`}
                  label={fieldName}
                  checked={messageFilters[messageName][fieldName]}
                  onChange={(event) =>
                    selectMessageFilter(event, messageName, fieldName)
                  }
                />
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}
