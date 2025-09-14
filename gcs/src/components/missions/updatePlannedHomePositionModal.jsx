import { Button, Group, Modal } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import { intToCoord } from "../../helpers/dataFormatters"
import {
  resetUpdatePlannedHomePositionFromLoadData,
  selectPlannedHomePosition,
  selectUpdatePlannedHomePositionFromLoadData,
  selectUpdatePlannedHomePositionFromLoadModal,
  setUpdatePlannedHomePositionFromLoadModal,
  updatePlannedHomePositionBasedOnLoadedWaypointsThunk,
} from "../../redux/slices/missionSlice"

const coordsFractionDigits = 7

export default function UpdatePlannedHomePositionModal() {
  const dispatch = useDispatch()

  const plannedHomePosition = useSelector(selectPlannedHomePosition)
  const updatePlannedHomePositionFromLoadModalOpened = useSelector(
    selectUpdatePlannedHomePositionFromLoadModal,
  )
  const updatePlannedHomePositionFromLoadModalData = useSelector(
    selectUpdatePlannedHomePositionFromLoadData,
  )

  const currentLat = intToCoord(plannedHomePosition?.lat).toFixed(
    coordsFractionDigits,
  )
  const currentLon = intToCoord(plannedHomePosition?.lon).toFixed(
    coordsFractionDigits,
  )
  const currentAlt = plannedHomePosition?.alt
  const newLat = intToCoord(
    updatePlannedHomePositionFromLoadModalData?.lat,
  ).toFixed(coordsFractionDigits)
  const newLon = intToCoord(
    updatePlannedHomePositionFromLoadModalData?.lon,
  ).toFixed(coordsFractionDigits)
  const newAlt = updatePlannedHomePositionFromLoadModalData?.alt

  console.log(currentLat === newLat)

  return (
    <Modal
      opened={updatePlannedHomePositionFromLoadModalOpened}
      onClose={() => dispatch(setUpdatePlannedHomePositionFromLoadModal(false))}
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center">
          Update the planned home position to the home position loaded from the{" "}
          {updatePlannedHomePositionFromLoadModalData?.from || "source"}?
        </p>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold">Current</span>
              <span>Lat: {currentLat ?? "-"}</span>
              <span>Lon: {currentLon ?? "-"}</span>
              <span>Alt: {currentAlt ?? "-"}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold">New</span>
              <span
                className={currentLat === newLat ? "" : "text-falconred-400"}
              >
                Lat: {newLat ?? "-"}
              </span>
              <span
                className={currentLon === newLon ? "" : "text-falconred-400"}
              >
                Lon: {newLon ?? "-"}
              </span>
              <span
                className={currentAlt === newAlt ? "" : "text-falconred-400"}
              >
                Alt: {newAlt ?? "-"}
              </span>
            </div>
          </div>
        </div>

        <Group gap="xl" justify="space-between">
          <Button
            size="sm"
            onClick={() => {
              dispatch(setUpdatePlannedHomePositionFromLoadModal(false))
              dispatch(resetUpdatePlannedHomePositionFromLoadData())
            }}
          >
            No
          </Button>
          <Button
            size="sm"
            onClick={() =>
              dispatch(updatePlannedHomePositionBasedOnLoadedWaypointsThunk())
            }
          >
            Yes
          </Button>
        </Group>
      </div>
    </Modal>
  )
}
