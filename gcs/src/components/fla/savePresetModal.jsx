// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
// Third party imports
import { useState } from "react"
import { Modal, TextInput, Button, Group } from "@mantine/core"

// Redux imports
import { useDispatch, useSelector } from "react-redux"
import {
  selectLogType,
  selectMessageFilters,
  selectAircraftType,
  setCanSavePreset,
} from "../../redux/slices/logAnalyserSlice.js"
import {
  queueSuccessNotification,
  queueErrorNotification,
} from "../../redux/slices/notificationSlice.js"

export default function SavePresetModal({
  opened,
  close,
  saveCustomPreset,
  findExistingPreset,
}) {
  const [presetName, setPresetName] = useState("")
  const tailwindColors = resolveConfig(tailwindConfig).theme.colors

  // Redux selectors
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)
  const aircraftType = useSelector(selectAircraftType)

  // Redux state
  const dispatch = useDispatch()
  const updateCanSavePreset = (canSave) => {
    dispatch(setCanSavePreset(canSave))
  }
  const dispatchSuccessNotification = (message) => {
    dispatch(queueSuccessNotification(message))
  }
  const dispatchErrorNotification = (message) => {
    dispatch(queueErrorNotification(message))
  }

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
        dispatchSuccessNotification(
          `Custom preset "${presetName}" saved successfully`,
        )
        close()
        updateCanSavePreset(false)
      } else {
        if (existingPreset.name === presetName) {
          dispatchErrorNotification(
            `The name "${presetName}" is in use. Please choose a different name.`,
          )
        } else {
          dispatchErrorNotification(
            `Custom preset "${presetName}" already exists as "${existingPreset.name}".`,
          )
          close()
          updateCanSavePreset(false)
        }
      }
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setPresetName("")
        close()
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
              close()
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
