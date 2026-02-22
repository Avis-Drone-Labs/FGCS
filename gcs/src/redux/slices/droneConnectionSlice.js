import { createSlice } from "@reduxjs/toolkit"

export const ConnectionType = {
  Serial: "serial",
  Network: "network",
}

const initialState = {
  // drone connection status
  connecting: false,
  connected: false,
  connection_modal: false,
  connection_status: {
    message: "",
    progress: 0,
  },
  connected_to_simulator: false,

  // aircraft type
  aircraft_type: 0,

  // drone connection parameters
  wireless: true, // local
  baudrate: "9600", // local
  connection_type: ConnectionType.Serial, // local

  // com ports
  fetching_com_ports: false,
  com_ports: [],
  selected_com_ports: null,

  // network parameters
  network_type: "tcp", // local
  ip: "127.0.0.1", // local
  port: "5760", // local

  forwardingAddress: "", // local
  isForwarding: false, // local
  forwardingAddressModalOpened: false,

  currentPage: "dashboard",
  outsideVisibility: false, // local

  videoSource: null,
  videoMaximized: false,
  videoScale: 1,

  forceDisarmModalOpened: false,
}

const droneConnectionSlice = createSlice({
  name: "droneConnection",
  initialState,
  reducers: {
    // Setters
    setConnecting: (state, action) => {
      if (action.payload !== state.connecting) {
        state.connecting = action.payload
      }
    },
    setConnected: (state, action) => {
      if (action.payload !== state.connected) {
        state.connected = action.payload
      }
    },
    setConnectedToSimulator: (state, action) => {
      if (action.payload !== state.connected_to_simulator) {
        state.connected_to_simulator = action.payload
      }
    },
    setBaudrate: (state, action) => {
      if (action.payload !== state.baudrate) {
        state.baudrate = action.payload
      }
    },
    setConnectionType: (state, action) => {
      if (action.payload !== state.connection_type) {
        state.connection_type = action.payload
      }
    },
    setFetchingComPorts: (state, action) => {
      if (action.payload !== state.fetching_com_ports) {
        state.fetching_com_ports = action.payload
      }
    },
    setComPorts: (state, action) => {
      if (action.payload !== state.com_ports) {
        state.com_ports = action.payload
      }
    },
    setSelectedComPorts: (state, action) => {
      if (action.payload !== state.selected_com_ports) {
        state.selected_com_ports = action.payload
      }
    },
    setNetworkType: (state, action) => {
      if (action.payload !== state.network_type) {
        state.network_type = action.payload
      }
    },
    setIp: (state, action) => {
      if (action.payload !== state.ip) {
        state.ip = action.payload
      }
    },
    setPort: (state, action) => {
      if (action.payload !== state.port) {
        state.port = action.payload
      }
    },
    setConnectionModal: (state, action) => {
      if (action.payload !== state.connection_modal) {
        state.connection_modal = action.payload
      }
    },
    setConnectionStatus: (state, action) => {
      if (action.payload !== state.connection_status) {
        state.connection_status = action.payload
      }
    },
    setWireless: (state, action) => {
      if (action.payload !== state.wireless) {
        state.wireless = action.payload
      }
    },
    setForwardingAddress: (state, action) => {
      state.forwardingAddress = action.payload
    },
    setIsForwarding: (state, action) => {
      state.isForwarding = action.payload
    },
    setForwardingAddressModalOpened: (state, action) => {
      state.forwardingAddressModalOpened = action.payload
    },
    setCurrentPage: (state, action) => {
      if (action.payload !== state.currentPage) {
        state.currentPage = action.payload
      }
    },
    setOutsideVisibility: (state, action) => {
      if (action.payload !== state.outsideVisibility) {
        state.outsideVisibility = action.payload
      }
    },
    setVideoSource: (state, action) => {
      state.videoSource = action.payload
    },
    setVideoMaximized: (state, action) => {
      state.videoMaximized = action.payload
    },
    setVideoScale: (state, action) => {
      state.videoScale = action.payload
    },
    setForceDisarmModalOpened: (state, action) => {
      state.forceDisarmModalOpened = action.payload
    },

    // Emits
    emitIsConnectedToDrone: () => {},
    emitGetComPorts: (state) => {
      state.fetching_com_ports = true
    },
    emitDisconnectFromDrone: () => {},
    emitConnectToDrone: () => {},
    emitStartForwarding: () => {},
    emitStopForwarding: () => {},
    emitSetState: () => {},
    emitGetHomePosition: () => {},
    emitGetCurrentMissionAll: () => {},
    emitSetLoiterRadius: () => {},
    emitGetLoiterRadius: () => {},
    emitReposition: () => {},
    emitArmDisarm: () => {},
    emitTakeoff: () => {},
    emitLand: () => {},
    emitSetCurrentFlightMode: () => {},
  },
  selectors: {
    selectConnecting: (state) => state.connecting,
    selectConnectedToDrone: (state) => state.connected,
    selectConnectedToSimulator: (state) => state.connected_to_simulator,
    selectBaudrate: (state) => state.baudrate,
    selectConnectionType: (state) => state.connection_type,
    selectFetchingComPorts: (state) => state.fetching_com_ports,
    selectComPorts: (state) => state.com_ports,
    selectSelectedComPorts: (state) => state.selected_com_ports,
    selectNetworkType: (state) => state.network_type,
    selectIp: (state) => state.ip,
    selectPort: (state) => state.port,
    selectConnectionModal: (state) => state.connection_modal,
    selectConnectionStatus: (state) => state.connection_status,
    selectWireless: (state) => state.wireless,
    selectForwardingAddress: (state) => state.forwardingAddress,
    selectIsForwarding: (state) => state.isForwarding,
    selectForwardingAddressModalOpened: (state) =>
      state.forwardingAddressModalOpened,
    selectCurrentPage: (state) => state.currentPage,
    selectOutsideVisibility: (state) => state.outsideVisibility,
    selectVideoSource: (state) => state.videoSource,
    selectVideoMaximized: (state) => state.videoMaximized,
    selectVideoScale: (state) => state.videoScale,
    selectForceDisarmModalOpened: (state) => state.forceDisarmModalOpened,
  },
})

export const {
  // Setters
  setConnecting,
  setConnected,
  setConnectedToSimulator,
  setBaudrate,
  setConnectionType,
  setFetchingComPorts,
  setComPorts,
  setSelectedComPorts,
  setNetworkType,
  setIp,
  setPort,
  setConnectionModal,
  setConnectionStatus,
  setWireless,
  setForwardingAddress,
  setIsForwarding,
  setForwardingAddressModalOpened,
  setCurrentPage,
  setOutsideVisibility,
  setVideoSource,
  setVideoMaximized,
  setVideoScale,
  setForceDisarmModalOpened,

  // Emitters
  emitIsConnectedToDrone,
  emitGetComPorts,
  emitDisconnectFromDrone,
  emitConnectToDrone,
  emitStartForwarding,
  emitStopForwarding,
  emitSetState,
  emitGetHomePosition,
  emitGetCurrentMissionAll,
  emitSetLoiterRadius,
  emitGetLoiterRadius,
  emitReposition,
  emitArmDisarm,
  emitTakeoff,
  emitLand,
  emitSetCurrentFlightMode,
} = droneConnectionSlice.actions
export const {
  selectConnecting,
  selectConnectedToDrone,
  selectConnectedToSimulator,
  selectBaudrate,
  selectConnectionType,
  selectFetchingComPorts,
  selectComPorts,
  selectSelectedComPorts,
  selectNetworkType,
  selectIp,
  selectPort,
  selectConnectionModal,
  selectConnectionStatus,
  selectWireless,
  selectForwardingAddress,
  selectIsForwarding,
  selectForwardingAddressModalOpened,
  selectCurrentPage,
  selectOutsideVisibility,
  selectVideoSource,
  selectVideoMaximized,
  selectVideoScale,
  selectForceDisarmModalOpened,
} = droneConnectionSlice.selectors

export default droneConnectionSlice
