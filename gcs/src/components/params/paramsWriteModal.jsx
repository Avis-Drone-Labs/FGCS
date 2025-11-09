import { Modal, Progress } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import {
  selectParamsWriteProgressData,
  selectParamsWriteProgressModalOpen,
  setParamsWriteProgressModalOpen,
} from "../../redux/slices/paramsSlice"

export default function ParamsWriteModal() {
  const dispatch = useDispatch()
  const opened = useSelector(selectParamsWriteProgressModalOpen)
  const progressData = useSelector(selectParamsWriteProgressData)
  const progressPercentage =
    progressData.current_index && progressData.total_params
      ? (progressData.current_index / progressData.total_params) * 100
      : 0

  return (
    <Modal
      opened={opened}
      onClose={() => dispatch(setParamsWriteProgressModalOpen(false))}
      title={"Writing params to drone"}
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col items-center justify-center mt-4">
        {progressData.message && (
          <p className="text-center mb-2">{progressData.message}</p>
        )}

        {progressPercentage !== null && progressPercentage !== undefined && (
          <Progress
            animated
            size="lg"
            transitionDuration={300}
            value={progressPercentage}
            className="w-full mx-auto my-auto"
          />
        )}
      </div>
    </Modal>
  )
}
