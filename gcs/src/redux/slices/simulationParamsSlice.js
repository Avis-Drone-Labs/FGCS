import { createSlice } from "@reduxjs/toolkit"

export const SimulationStatus = {
  Idle: "idle",
  Starting: "starting",
  Running: "running",
}

const initialState = {
  simulationModalOpened: false,
  simulationStatus: SimulationStatus.Idle,
  ports: [{ hostPort: 5760, containerPort: 5760 }],
  vehicleType: "ArduCopter",
  connectAfterStart: true,
}

const simulationParamsSlice = createSlice({
  name: "simulationParams",
  initialState,
  reducers: {
    setSimulationModalOpened: (state, action) => {
      state.simulationModalOpened = action.payload
    },
    setSimulationStatus: (state, action) => {
      state.simulationStatus = action.payload
    },
    setSimulationParams: (state, action) => {
      state.simulationParams = action.payload
    },
    setSimulationParam: (state, action) => {
      const { key, value } = action.payload
      state[key] = value === "" || value === undefined ? null : value
    },
    addSimulationPort: (state) => {
      state.ports.push({ hostPort: 5760, containerPort: 5760 })
    },
    removeSimulationPort: (state, action) => {
      state.ports.splice(action.payload, 1)
    },
    updateSimulationPort: (state, action) => {
      const { index, key, value } = action.payload
      state.ports[index][key] = value
    },
    setSimulationVehicleType: (state, action) => {
      state.vehicleType = action.payload
    },
    setSimulationConnectAfterStart: (state, action) => {
      state.connectAfterStart = action.payload
    },

    // Emits
    emitStartSimulation: () => {},
    emitStopSimulation: () => {},
  },
  selectors: {
    selectSimulationStatus: (state) => state.simulationStatus,
    selectIsSimulationRunning: (state) =>
      state.simulationStatus === SimulationStatus.Running,
    selectSimulationModalOpened: (state) => state.simulationModalOpened,
    selectSimulationPorts: (state) => state.ports,
    selectSimulationVehicleType: (state) => state.vehicleType,
    selectSimulationConnectAfterStart: (state) => state.connectAfterStart,
  },
})

export const {
  setSimulationStatus,
  setSimulationModalOpened,
  addSimulationPort,
  removeSimulationPort,
  updateSimulationPort,
  setSimulationVehicleType,
  setSimulationConnectAfterStart,

  // Emitters
  emitStartSimulation,
  emitStopSimulation,
} = simulationParamsSlice.actions
export const {
  selectSimulationStatus,
  selectIsSimulationRunning,
  selectSimulationModalOpened,
  selectSimulationPorts,
  selectSimulationVehicleType,
  selectSimulationConnectAfterStart,
} = simulationParamsSlice.selectors

export default simulationParamsSlice
