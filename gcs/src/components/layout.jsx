/*
  Custom component to control the layout of each page. This is where the navbar is loaded, all pages use this.
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Notifications } from "@mantine/notifications"

// Helpers and custom component imports
import { showErrorNotification } from "../helpers/notification"
import { socket } from "../helpers/socket"
import Navbar from "./navbar"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { emitGetCurrentMission, emitSetState, selectConnectedToDrone } from "../redux/slices/droneConnectionSlice"

export default function Layout({ children, currentPage }) {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)

  // Handle drone errors
  useEffect(() => {
    socket.on("drone_error", (err) => {
      showErrorNotification(err.message)
    })

    return () => {
      socket.off("drone_error")
    }
  }, [])

  // Handle switching to states
  useEffect(() => {
    if (!connectedToDrone) return

    dispatch(emitSetState({ state: currentPage }))
    if (currentPage.toLowerCase() == "dashboard") {
      dispatch(emitGetCurrentMission())
    }
  }, [currentPage, connectedToDrone])

  return (
    <>
      <Navbar currentPage={currentPage} className="no-drag" />
      <Notifications limit={5} position="bottom-center" />
      {children}
    </>
  )
}
