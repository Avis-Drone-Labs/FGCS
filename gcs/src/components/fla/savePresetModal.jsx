// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
// Third party imports
import React, { useState } from "react"
import { Modal, TextInput, Button, Group } from "@mantine/core"
export default function SavePresetModal({ opened, close, onSave }) {
  const [presetName, setPresetName] = useState("")
  const tailwindColors = resolveConfig(tailwindConfig).theme.colors

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
          onSave(presetName.trim())
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
