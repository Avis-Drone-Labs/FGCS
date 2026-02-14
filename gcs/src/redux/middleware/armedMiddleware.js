/**
 * Armed Monitor Middleware
 *
 * This middleware monitors the armed status of the aircraft and runs
 * a callback function every 1 second while the aircraft is armed.
 *
 * The interval starts when the aircraft becomes armed and stops when
 * it becomes disarmed.
 */

import { setTotalTimeFlying } from "../slices/droneInfoSlice"

const armedMonitorMiddleware = (store) => {
  let intervalId = null
  let wasArmed = false

  return (next) => (action) => {
    const result = next(action)

    // Check current armed status from state
    const state = store.getState()
    const isArmed = state.droneInfo?.isArmed || false

    // Handle armed state change
    if (isArmed && !wasArmed) {
      // Just armed - start interval
      const intervalCallback = () => {
        const currentState = store.getState()
        const isFlying = currentState.droneInfo?.isFlying || false

        if (isFlying) {
          // Aircraft is flying - increment total time flying by 1 second
          const currentTotal = currentState.droneInfo?.totalTimeFlying || 0
          store.dispatch(setTotalTimeFlying(currentTotal + 1))
        }
      }

      // Run callback immediately when armed
      intervalCallback()

      // Set up 1-second interval
      intervalId = setInterval(intervalCallback, 1000)
    } else if (!isArmed && wasArmed) {
      // Just disarmed - clear interval
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Update previous armed state
    wasArmed = isArmed

    return result
  }
}

export default armedMonitorMiddleware
