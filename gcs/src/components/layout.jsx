/*
  Custom component to control the layout of each page. This is where the navbar is loaded, all pages use this.
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Notifications } from "@mantine/notifications"

// Helpers and custom component imports
import {
  showErrorNotification,
  showInfoNotification,
  showSuccessNotification,
} from "../helpers/notification"

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
import {
  notificationShown,
  selectNotificationQueue,
} from "../redux/slices/notificationSlice"

export default function Layout({ children, currentPage }) {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  const notificationQueue = useSelector(selectNotificationQueue)
  const aircraftTypeString = useSelector(selectAircraftTypeString)
  const shouldFetchAllMissionsOnDashboard = useSelector(
    selectShouldFetchAllMissionsOnDashboard,
  )

  // Show queued notifications
  useEffect(() => {
    if (notificationQueue.length !== 0) {
      const message = notificationQueue[0].message
      if (notificationQueue[0].type === "error") {
        showErrorNotification(message)
      } else if (notificationQueue[0].type === "success") {
        showSuccessNotification(message)
      } else {
        showInfoNotification(message)
      }
      dispatch(notificationShown())
    }
  }, [notificationQueue, dispatch])

  // Handle switching to states
  useEffect(() => {
    dispatch(emitSetState(currentPage))

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
