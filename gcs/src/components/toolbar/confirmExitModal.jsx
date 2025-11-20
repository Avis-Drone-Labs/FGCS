// Custom Imports
import { Group, Modal, Button, Text } from "@mantine/core"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  selectConfirmExitModalOpen,
  setConfirmExitModalOpen,
} from "../../redux/slices/applicationSlice"

// Tailwind
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function ConfirmExitModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectConfirmExitModalOpen)

  const confirmExit = () => {
    window.ipcRenderer.send("window:close")
  }

  return (
    <Modal
      opened={modalOpen}
      onClose={() => dispatch(setConfirmExitModalOpen(false))}
      title="Are you sure you want to quit FGCS?"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        content: {
          borderRadius: "0.5rem",
        },
      }}
      withCloseButton={false}
    >
      <Text mb={16} c="dimmed" size="sm">
        You are connected to an aircraft, are you sure you want to quit FGCS?
      </Text>
      <Group justify="space-between" className="pt-4">
        <Button
          variant="filled"
          onClick={() => dispatch(setConfirmExitModalOpen(false))}
        >
          Cancel
        </Button>
        <Button
          variant="filled"
          type="submit"
          color={tailwindColors.red[600]}
          onClick={() => confirmExit()}
        >
          Quit
        </Button>
      </Group>
    </Modal>
  )
}
