import { Button, Modal, Text } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import {
  emitArmDisarm,
  selectForceArmModalOpened,
  setForceArmModalOpened,
} from "../../redux/slices/droneConnectionSlice"

export default function ForceArmModal() {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectForceArmModalOpened)

  const handleForceArm = () => {
    dispatch(emitArmDisarm({ arm: true, force: true }))
    dispatch(setForceArmModalOpened(false))
  }

  const handleCancel = () => {
    dispatch(setForceArmModalOpened(false))
  }

  return (
    <Modal
      opened={isOpen}
      onClose={handleCancel}
      title="The aircraft failed to arm normally."
      centered
    >
      <div className="flex flex-col gap-4">
        <Text weight={700} c="red">
          Do you want to force arm the aircraft?
        </Text>
        <Text size="sm" c="dimmed">
          Warning: Force arming bypasses pre-arm safety checks. Only do this if
          you are certain it is safe to do so.
        </Text>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="default" className="grow">
            Cancel
          </Button>
          <Button onClick={handleForceArm} color="red" className="grow">
            Force Arm
          </Button>
        </div>
      </div>
    </Modal>
  )
}
