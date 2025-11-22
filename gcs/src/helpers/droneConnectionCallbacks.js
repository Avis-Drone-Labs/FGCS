import { useCallback } from "react"
import { useDispatch } from "react-redux"

import {
  emitGetComPorts,
  setConnectionModal,
  emitDisconnectFromDrone,
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
  return useCallback(() => {
    dispatch(emitRebootAutopilot())
    dispatch(setAutoPilotRebootModalOpen(true))
    dispatch(resetParamState())
  }, [dispatch])
}

/**
 * Hook that returns a callback to initiate a connection to the drone
 * via a button click. Fetches available COM ports and opens the
 * connection modal.
 * @returns Callback to connect to the drone
 */
export function useConnectToDroneFromButtonCallback() {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch(emitGetComPorts())
    dispatch(setConnectionModal(true))
  }, [dispatch])
}

/**
 * Hook that returns a callback to disconnect from the drone.
 * Initiates the disconnect procedure.
 * @returns Callback to disconnect from the drone
 */
export function useDisconnectFromDroneCallback() {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch(emitDisconnectFromDrone())
  }, [dispatch])
}
