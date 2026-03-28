import { Button, Modal, Text } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import {
  emitArmDisarm,
  selectForceDisarmModalOpened,
  setForceDisarmModalOpened,
} from "../../redux/slices/droneConnectionSlice"

export default function ForceDisarmModal() {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectForceDisarmModalOpened)

  const handleForceDisarm = () => {
    dispatch(emitArmDisarm({ arm: false, force: true }))
    dispatch(setForceDisarmModalOpened(false))
  }

  const handleCancel = () => {
    dispatch(setForceDisarmModalOpened(false))
  }

  return (
    <Modal
      opened={isOpen}
      onClose={handleCancel}
      title="The aircraft failed to disarm normally."
      centered
    >
      <div className="flex flex-col gap-4">
        <Text weight={700} c="red">
          Do you want to force disarm the aircraft?
        </Text>
        <Text size="sm" c="dimmed">
          Warning: Force disarming bypasses safety checks and could cause the
          aircraft to crash if it's still airborne.
        </Text>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="default" className="grow">
            Cancel
          </Button>
          <Button onClick={handleForceDisarm} color="red" className="grow">
            Force Disarm
          </Button>
        </div>
      </div>
    </Modal>
  )
}
