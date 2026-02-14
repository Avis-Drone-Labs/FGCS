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

            Object.keys(preset.filters || {}).forEach((key) => {
              if (!messageFilters[key]) {
                missingMessages.push(key)
              } else {
                const requiredFields = preset.filters[key] || []
                const availableFields = formatMessages?.[key]?.fields || []

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
