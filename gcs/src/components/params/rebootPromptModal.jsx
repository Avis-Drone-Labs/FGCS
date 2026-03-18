import { useDispatch, useSelector } from "react-redux"
import { Button, Group, Modal } from "@mantine/core"
import {
  selectRebootPromptModalOpen,
  setRebootPromptModalOpen,
} from "../../redux/slices/paramsSlice"
import { useRebootCallback } from "../../helpers/droneConnectionCallbacks"

export default function RebootPromptModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectRebootPromptModalOpen)
  const rebootCallback = useRebootCallback()

  return (
    <Modal
      opened={modalOpen}
      onClose={() => {
        dispatch(setRebootPromptModalOpen(false))
      }}
      title="Reboot Required"
      withCloseButton={false}
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
    >
      <p>A reboot is required for your recent changes to apply.</p>

      <Group justify="space-between" className="mt-4">
        <Button
          variant="filled"
          onClick={() => {
            dispatch(setRebootPromptModalOpen(false))
          }}
        >
          Not Right Now
        </Button>

        <Button
          variant="filled"
          color={"red"}
          data-autofocus
          onClick={() => {
            rebootCallback()
            dispatch(setRebootPromptModalOpen(false))
          }}
        >
          Reboot FC
        </Button>
      </Group>
    </Modal>
  )
}
