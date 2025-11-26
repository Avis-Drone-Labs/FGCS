import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import { showErrorNotification } from "./notification.js"

import {
  emitGetComPorts,
  setConnectionModal,
  emitDisconnectFromDrone,
  selectConnectedToDrone,
} from "../redux/slices/droneConnectionSlice.js"

import {
  emitRebootAutopilot,
  setAutoPilotRebootModalOpen,
  resetParamState,
} from "../redux/slices/paramsSlice.js"

/**
 * Hook that returns a callback to reboot the autopilot.
 * Initiates autopilot reboot, displays status modal, and resets params.
 * @returns Callback to reboot autopilot
 */
export function useRebootCallback() {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  return useCallback(() => {
    if (connectedToDrone) {
      dispatch(emitRebootAutopilot())
      dispatch(setAutoPilotRebootModalOpen(true))
      dispatch(resetParamState())
    } else {
      showErrorNotification("Cannot reboot: no drone connected.")
    }
  }, [dispatch, connectedToDrone])
}

/**
 * Hook that returns a callback to initiate a connection to the drone
 * via a button click. Fetches available COM ports and opens the
 * connection modal.
 * @returns Callback to connect to the drone
 */
export function useConnectToDroneFromButtonCallback() {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  return useCallback(() => {
    if (!connectedToDrone) {
      dispatch(emitGetComPorts())
      dispatch(setConnectionModal(true))
    } else {
      showErrorNotification("Cannot connect: already connected.")
    }
  }, [dispatch, connectedToDrone])
}

/**
 * Hook that returns a callback to disconnect from the drone.
 * Initiates the disconnect procedure.
 * @returns Callback to disconnect from the drone
 */
export function useDisconnectFromDroneCallback() {
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  return useCallback(() => {
    if (connectedToDrone) {
      dispatch(emitDisconnectFromDrone())
    } else {
      showErrorNotification("Cannot disconnect: no drone connected.")
    }
  }, [dispatch, connectedToDrone])
}
