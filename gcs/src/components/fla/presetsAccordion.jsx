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

    const filterCategories = (categories = []) =>
      (categories || [])
        .map((category) => ({
          ...category,
          presets: (category.presets || []).filter((preset) =>
            Object.keys(preset.filters || {}).every((key) => {
              if (!messageFilters[key]) return false
              const requiredFields = preset.filters[key] || []
              const availableFields = formatMessages?.[key]?.fields || []
              return requiredFields.every((field) =>
                availableFields.includes(field),
              )
            }),
          ),
        }))
        .filter((category) => (category.presets || []).length > 0)

    const presetCategoryKey = getPresetKeys(logType).categoryKey

    const defaults = filterCategories(presetCategories[logType])
    const custom = filterCategories(presetCategories[presetCategoryKey])

    return { defaults, custom }
  }, [presetCategories, logType, messageFilters])

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
