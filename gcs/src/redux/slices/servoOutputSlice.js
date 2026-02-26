import { createSlice } from "@reduxjs/toolkit"

// This slice will store the latest SERVO_OUTPUT_RAW values for each output channel
const initialState = {
  // Map: channel number (1-based) -> PWM value
  outputs: {},
}

const servoOutputSlice = createSlice({
  name: "servoOutput",
  initialState,
  reducers: {
    setServoOutputs: (state, action) => {
      // action.payload: { [channel]: pwm, ... }
      state.outputs = { ...state.outputs, ...action.payload }
    },
    resetServoOutputs: (state) => {
      state.outputs = {}
    },
  },
  selectors: {
    selectServoOutputs: (state) => state.outputs,
  },
})

export const { setServoOutputs, resetServoOutputs } = servoOutputSlice.actions
export const { selectServoOutputs } = servoOutputSlice.selectors
export default servoOutputSlice
