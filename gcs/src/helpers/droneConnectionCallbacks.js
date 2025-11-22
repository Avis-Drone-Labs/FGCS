import { useCallback } from "react"
import { useDispatch } from "react-redux"

import {
  emitGetComPorts,
  setConnectionModal,
  emitDisconnectFromDrone
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

export function useConnectToDroneFromButtonCallback() {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch(emitGetComPorts())
    dispatch(setConnectionModal(true))
  }, [dispatch])
}

export function useDisconnectFromDroneCallback() {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch(emitDisconnectFromDrone())
  }, [dispatch])
}
