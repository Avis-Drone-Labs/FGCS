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

  function differenceBetweenCoordsStyling(coord, compare) {
    if (!coord) return <span>-</span>
    if (coord === compare) return <span>{coord}</span>

    // Loop through each digit and highlight it and the rest of the string red
    let differentIndex = 0;
    for (let i = 0; i < coord.length; i++) {
      differentIndex = i
      if (coord[i] !== compare[i]) break
    }
    coord = coord.toString()
    return <><span>{coord.slice(0, differentIndex)}</span><span className="text-falconred-600 font-bold">{coord.slice(differentIndex)}</span></>
  }

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
        <p>
          Would you like to update the planned home position to the home position loaded from the{" "}
          {updatePlannedHomePositionFromLoadModalData?.from || "source"}?
        </p>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col flex-1">
              <span className="font-bold">Current</span>
              <span>Lat: {currentLat ?? "-"}</span>
              <span>Lon: {currentLon ?? "-"}</span>
              <span>Alt: {currentAlt ?? "-"}</span>
            </div>
            <div className="flex flex-col text-right flex-1">
              <span className="font-bold">New</span>
              <span>
                Lat: {differenceBetweenCoordsStyling(newLat, currentLat)}
              </span>
              <span>
                Lon: {differenceBetweenCoordsStyling(newLon, currentLon)}
              </span>
              <span>
                Alt: {differenceBetweenCoordsStyling(newAlt, currentAlt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-between">
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
        </div>
      </div>
    </Modal>
  )
}
