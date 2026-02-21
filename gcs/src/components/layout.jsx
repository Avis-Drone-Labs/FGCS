/*
  Custom component to control the layout of each page. This is where the navbar is loaded, all pages use this.
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Notifications } from "@mantine/notifications"

// Helpers and custom component imports

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetCurrentMissionAll,
  emitGetHomePosition,
  emitGetLoiterRadius,
  emitSetState,
  selectConnectedToDrone,
} from "../redux/slices/droneConnectionSlice"
import { selectAircraftTypeString } from "../redux/slices/droneInfoSlice"
import { selectShouldFetchAllMissionsOnDashboard } from "../redux/slices/missionSlice"

export default function Layout({ children, currentPage }) {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  const aircraftTypeString = useSelector(selectAircraftTypeString)
  const shouldFetchAllMissionsOnDashboard = useSelector(
    selectShouldFetchAllMissionsOnDashboard,
  )

  // Handle switching to states
  useEffect(() => {
    // Individual config pages handle setting state
    if (currentPage !== "config") {
      dispatch(emitSetState(currentPage))
    }

    if (!connectedToDrone) return

    if (currentPage.toLowerCase() == "dashboard") {
      dispatch(emitGetHomePosition()) // use actual home position

      if (shouldFetchAllMissionsOnDashboard) {
        dispatch(emitGetCurrentMissionAll())
      }

      if (aircraftTypeString === "Plane") {
        dispatch(emitGetLoiterRadius())
      }
    }
  }, [currentPage, connectedToDrone])

  return (
    <>
      <Notifications limit={5} position="bottom-center" />
      {children}
    </>
  )
}
