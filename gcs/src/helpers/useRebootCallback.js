import { useCallback } from "react"
import { useDispatch } from "react-redux"

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
