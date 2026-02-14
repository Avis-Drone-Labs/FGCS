/*
  PresetsAccordion
  Renders the list of preset categories (custom + defaults),
  filtering out presets whose message keys/fields aren't available in the loaded log.
*/

import { Accordion } from "@mantine/core"
import { Fragment, useMemo } from "react"
import { useSelector } from "react-redux"

import {
  selectFormatMessages,
  selectLogType,
  selectMessageFilters,
} from "../../redux/slices/logAnalyserSlice.js"
import PresetAccordionItem from "./presetAccordionItem.jsx"
import { getPresetKeys } from "./presetCategories.js"

export default function PresetsAccordion({
  presetCategories,
  deleteCustomPreset,
}) {
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)
  const formatMessages = useSelector(selectFormatMessages)

  // Helper function to find alternative message name
  // Treats MESSAGE[0] and MESSAGE as interchangeable
  const findMessageName = (requestedName) => {
    // If the exact name exists, return it
    if (messageFilters[requestedName]) {
      return requestedName
    }

    // Check if it's asking for MESSAGE[0] but log has MESSAGE
    if (requestedName.endsWith("[0]")) {
      const baseName = requestedName.slice(0, -3)
      if (messageFilters[baseName]) {
        return baseName
      }
    }

    // Check if it's asking for MESSAGE but log has MESSAGE[0]
    const indexedName = `${requestedName}[0]`
    if (messageFilters[indexedName]) {
      return indexedName
    }

    // No match found
    return null
  }

  const filteredPresetCategories = useMemo(() => {
    if (!presetCategories || !logType || !messageFilters) {
      return { defaults: [], custom: [] }
    }

    const processCategories = (categories = []) =>
      (categories || [])
        .map((category) => ({
          ...category,
          presets: (category.presets || []).map((preset) => {
            // Check which messages/fields are missing
            const missingMessages = []
            const missingFields = {}
            const messageNameMap = {} // Maps requested name to actual name in log

            Object.keys(preset.filters || {}).forEach((key) => {
              const actualMessageName = findMessageName(key)

              if (!actualMessageName) {
                // Message not found even with fallbacks
                missingMessages.push(key)
              } else {
                // Store the mapping for later use
                messageNameMap[key] = actualMessageName

                const requiredFields = preset.filters[key] || []
                const availableFields =
                  formatMessages?.[actualMessageName]?.fields || []

                // Check for missing fields
                const missing = requiredFields.filter(
                  (field) => !availableFields.includes(field),
                )
                if (missing.length > 0) {
                  missingFields[key] = missing
                }
              }
            })

            const isAvailable =
              missingMessages.length === 0 &&
              Object.keys(missingFields).length === 0

            return {
              ...preset,
              isAvailable,
              missingMessages,
              missingFields,
              messageNameMap, // Include the mapping for use in preset selection
            }
          }),
        }))
        .filter((category) => (category.presets || []).length > 0)

    const presetCategoryKey = getPresetKeys(logType).categoryKey

    const defaults = processCategories(presetCategories[logType])
    const custom = processCategories(presetCategories[presetCategoryKey])

    return { defaults, custom }
  }, [presetCategories, logType, messageFilters, formatMessages])

  return (
    <Accordion multiple={true}>
      {/* Custom Presets */}
      {filteredPresetCategories.custom.map((category) => (
        <Fragment key={category.name}>
          <PresetAccordionItem
            key={category.name}
            category={category}
            deleteCustomPreset={deleteCustomPreset}
          />
        </Fragment>
      ))}
      {/* Default Presets */}
      {filteredPresetCategories.defaults.map((category) => (
        <Fragment key={category.name}>
          <PresetAccordionItem key={category.name} category={category} />
        </Fragment>
      ))}
    </Accordion>
  )
}
