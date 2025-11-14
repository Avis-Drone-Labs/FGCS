import { useDispatch} from "react-redux"
import { useCallback } from "react"

import {
  emitRebootAutopilot,
  setAutoPilotRebootModalOpen,
  resetParamState,
} from "../redux/slices/paramsSlice.js"

/**
 * Hook that returns a callback to repoot the autopilot.
 * Displays reboot modal and resets params.
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
