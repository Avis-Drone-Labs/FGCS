import { createSlice } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"

export const SimulationStatus = {
  Idle: "idle",
  Starting: "starting",
  Running: "running",
  Stopping: "stopping",
}

const initialState = {
  simulationModalOpened: false,
  simulationStatus: SimulationStatus.Idle,
  ports: [{ id: uuidv4(), hostPort: 5760, containerPort: 5760 }],
  vehicleType: "ArduCopter",
  connectAfterStart: true,
  loadingNotificationIdsByOperation: {},
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
    addSimulationPort: (state) => {
      const startPort = 5762
      let hostPort = startPort
      while (state.ports.some((port) => port.hostPort === hostPort)) {
        hostPort += 1
      }
      let containerPort = startPort
      while (state.ports.some((port) => port.containerPort === containerPort)) {
        containerPort += 1
      }
      state.ports.push({ id: uuidv4(), hostPort, containerPort })
    },
    removeSimulationPortById: (state, action) => {
      state.ports = state.ports.filter((p) => p.id !== action.payload)
    },
    updateSimulationPortById: (state, action) => {
      const { id, key, value } = action.payload
      const port = state.ports.find((p) => p.id === id)
      if (port) port[key] = value
    },
    setSimulationVehicleType: (state, action) => {
      state.vehicleType = action.payload
    },
    setSimulationConnectAfterStart: (state, action) => {
      state.connectAfterStart = action.payload
    },
    setSimulationLoadingNotificationId: (state, action) => {
      const { operationId, notificationId } = action.payload
      state.loadingNotificationIdsByOperation[operationId] = notificationId
    },
    clearSimulationLoadingNotificationId: (state, action) => {
      const { operationId } = action.payload
      delete state.loadingNotificationIdsByOperation[operationId]
    },

    // Emits
    emitStartSimulation: () => {},
    emitStopSimulation: () => {},
  },
  selectors: {
    selectSimulationStatus: (state) => state.simulationStatus,
    selectIsSimulationRunning: (state) =>
      state.simulationStatus === SimulationStatus.Running ||
      state.simulationStatus === SimulationStatus.Stopping,
    selectSimulationModalOpened: (state) => state.simulationModalOpened,
    selectSimulationPorts: (state) => state.ports,
    selectSimulationVehicleType: (state) => state.vehicleType,
    selectSimulationConnectAfterStart: (state) => state.connectAfterStart,
    selectSimulationLoadingNotificationIdsByOperation: (state) =>
      state.loadingNotificationIdsByOperation,
  },
})

export const {
  setSimulationStatus,
  setSimulationModalOpened,
  addSimulationPort,
  removeSimulationPortById,
  updateSimulationPortById,
  setSimulationVehicleType,
  setSimulationConnectAfterStart,
  setSimulationLoadingNotificationId,
  clearSimulationLoadingNotificationId,

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
  selectSimulationLoadingNotificationIdsByOperation,
} = simulationParamsSlice.selectors

export default simulationParamsSlice
