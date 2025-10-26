/*
  MessagesFiltersAccordion
  Renders the list of log message accordions with checkboxes that control whether or
  not they show on the graph.
  This also contains the descriptions of all log messages from helpers.
*/

// 3rd Party Imports
import { Accordion, Checkbox } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"

// Helper imports
import { logMessageDescriptions } from "../../helpers/logMessageDescriptions.js"

// Local imports
import {
  selectColorIndex,
  selectCustomColors,
  selectMessageFilters,
  setCanSavePreset,
  setColorIndex,
  setCustomColors,
  setMessageFilters,
} from "../../redux/slices/logAnalyserSlice.js"
import { colorPalette } from "./constants.js"

export default function MessagesFiltersAccordion() {
  const dispatch = useDispatch()

  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)
  const colorIndex = useSelector(selectColorIndex)

  if (!messageFilters) return null

  // handles color assignment and checks if a new preset can be saved
  function selectMessageFilter(event, messageName, fieldName) {
    // Use shallow cloning for better performance
    const newFilters = {
      ...messageFilters,
      [messageName]: {
        ...messageFilters[messageName],
        [fieldName]: event.currentTarget.checked,
      },
    }

    const checked = event.currentTarget.checked
    let newColors = { ...customColors }

    if (!checked) {
      delete newColors[`${messageName}/${fieldName}`]
    } else {
      if (!newColors[`${messageName}/${fieldName}`]) {
        newColors[`${messageName}/${fieldName}`] =
          colorPalette[colorIndex % colorPalette.length]
        dispatch(setColorIndex((colorIndex + 1) % colorPalette.length))
      }
    }

    dispatch(setCustomColors(newColors))
    dispatch(setMessageFilters(newFilters))

    // Then check if we should allow saving preset
    // Only enable save if there are selected filters
    const hasSelectedFilters = Object.values(newFilters).some((category) =>
      Object.values(category).some((isSelected) => isSelected),
    )
    dispatch(setCanSavePreset(hasSelectedFilters))
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
