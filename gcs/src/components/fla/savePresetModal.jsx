// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
// Third party imports
import { Button, Group, Modal, TextInput } from "@mantine/core"
import { useState } from "react"

// Redux imports
import { useDispatch, useSelector } from "react-redux"
import {
  selectAircraftType,
  selectLogType,
  selectMessageFilters,
  setCanSavePreset,
} from "../../redux/slices/logAnalyserSlice.js"
import {
  queueErrorNotification,
  queueSuccessNotification,
} from "../../redux/slices/notificationSlice.js"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function SavePresetModal({
  isSavePresetModalOpen,
  closeSavePresetModal,
  saveCustomPreset,
  findExistingPreset,
}) {
  // Redux
  const dispatch = useDispatch()
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)
  const aircraftType = useSelector(selectAircraftType)

  const [presetName, setPresetName] = useState("")

  // Function to handle saving a custom preset
  function handleSaveCustomPreset(presetName) {
    if (!presetName) return

    if (presetName) {
      const currentFilters = Object.keys(messageFilters).reduce(
        (acc, category) => {
          const selectedFields = Object.keys(messageFilters[category]).filter(
            (field) => messageFilters[category][field] === true,
          )
          // Only add the category to the result if it has selected fields
          if (selectedFields.length > 0) {
            acc[category] = selectedFields
          }
          return acc
        },
        {},
      )

      const newPreset = {
        name: presetName,
        filters: currentFilters,
        aircraftType: aircraftType ? [aircraftType] : undefined, // Only save the aircraft type if it exists
      }

      const existingPreset = findExistingPreset(newPreset, logType)

      if (!existingPreset) {
        saveCustomPreset(newPreset, logType)
        dispatch(
          queueSuccessNotification(
            `Custom preset "${presetName}" saved successfully`,
          ),
        )
        closeSavePresetModal()
        dispatch(setCanSavePreset(false))
      } else {
        if (existingPreset.name === presetName) {
          dispatch(
            queueErrorNotification(
              `The name "${presetName}" is in use. Please choose a different name.`,
            ),
          )
        } else {
          dispatch(
            queueErrorNotification(
              `Custom preset "${presetName}" already exists as "${existingPreset.name}".`,
            ),
          )
          closeSavePresetModal()
          dispatch(setCanSavePreset(false))
        }
      }
    }
  }

  return (
    <Modal
      opened={isSavePresetModalOpen}
      onClose={() => {
        setPresetName("")
        closeSavePresetModal()
      }}
      title="Save Preset"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSaveCustomPreset(presetName.trim())
        }}
      >
        {/* Add character limit */}
        <TextInput
          label="Preset Name"
          placeholder="Enter preset name"
          onChange={(event) => setPresetName(event.currentTarget.value)}
          required
          data-autofocus
          maxLength={30}
        />
        <Group justify="space-between" className="pt-4">
          <Button
            variant="filled"
            color={tailwindColors.red[500]}
            onClick={() => {
              setPresetName("")
              closeSavePresetModal()
            }}
          >
            Close
          </Button>
          <Button
            variant="filled"
            type="submit"
            color={tailwindColors.green[600]}
            disabled={!presetName.trim()}
          >
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
