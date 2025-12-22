/*
    Modal that warns the user when trying to fetch params while armed or flying
*/

// 3rd party imports
import { Button, Modal, Text } from "@mantine/core"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectIsFlying } from "../../redux/slices/droneInfoSlice"
import {
  selectFetchParamsWarningModalOpen,
  setFetchParamsWarningModalOpen,
} from "../../redux/slices/paramsSlice"

export default function FetchParamsWarningModal({ onConfirm }) {
  const dispatch = useDispatch()
  const opened = useSelector(selectFetchParamsWarningModalOpen)
  const isFlying = useSelector(selectIsFlying)

  function handleConfirm() {
    dispatch(setFetchParamsWarningModalOpen(false))
    if (onConfirm) {
      onConfirm()
    }
  }

  function handleCancel() {
    dispatch(setFetchParamsWarningModalOpen(false))
  }

  const warningMessage = isFlying
    ? "The aircraft is currently flying. Fetching parameters while flying is not advised."
    : "The aircraft is currently armed. Fetching parameters while armed may affect the aircraft's behavior if it's flying."

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Warning: Fetch Parameters"
      closeOnClickOutside={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col gap-4">
        <Text>{warningMessage}</Text>
        <Text weight={500}>Are you sure you want to continue?</Text>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button color="yellow" onClick={handleConfirm}>
            Fetch Anyway
          </Button>
        </div>
      </div>
    </Modal>
  )
}
