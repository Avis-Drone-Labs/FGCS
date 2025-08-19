import { createSlice } from "@reduxjs/toolkit"
import { socket } from "../../helpers/socket"

export const ConnectionType = {
  Serial: "serial",
  Network: "network",
}

const initialState = {
  // drone connection status
  connecting: false,
  connected: false,
  connection_modal: false,
  connection_status: null,

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

    // Emits
    emitIsConnectedToDrone: () => {
      socket.emit("is_connected_to_drone")
    },
    emitGetComPorts: () => {
      socket.emit("get_com_ports")
      setFetchingComPorts(true)
    },
    emitDisconnectFromDrone: () => {
      console.log("Disconnecting from drone")
      socket.emit("disconnect_from_drone")
    },
    emitConnectToDrone: (_, action) => {
      console.log("Attempting to connect to drone")
      socket.emit("connect_to_drone", action.payload)
    },
    emitSetState: (_, action) => {
      console.log(`Setting State to ${action.payload.state} from redux`)
      socket.emit("set_state", action.payload)
    },
    emitGetHomePosition: () => {
      socket.emit("get_home_position")
    },
    emitGetCurrentMission: () => {
      console.log("Getting current mission from redux")
      socket.emit("get_current_mission_all")
    },
  },
  selectors: {
    selectConnecting: (state) => state.connecting,
    selectConnectedToDrone: (state) => state.connected,
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
  },
})

export const {
  // Setters
  setConnecting,
  setConnected,
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

  // Emitters
  emitIsConnectedToDrone,
  emitGetComPorts,
  emitDisconnectFromDrone,
  emitConnectToDrone,
  emitSetState,
  emitGetHomePosition,
  emitGetCurrentMission,
} = droneConnectionSlice.actions
export const {
  selectConnecting,
  selectConnectedToDrone,
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
} = droneConnectionSlice.selectors

export default droneConnectionSlice
