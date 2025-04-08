import { createSlice } from "@reduxjs/toolkit";

export const ConnectionType = {
    Serial: "serial",
    Network: "network",
}

const initialState = {
    // drone connection status
    connecting: false,
    connected: false,

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
                    state.connecting = action.payload
                }
            },
            setAircraftType: (state, action) => {
                if (action.payload !== state.aircraft_type) {
                    state.aircraft_type = action.payload
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

            // Emits
            emitIsConnectedToDrone: () => {}
        },
        selectors: {
            selectConnecting: (state) => state.connecting,
            selectConnected: (state) => state.connected,
            selectAircraftType: (state) => state.aircraft_type,
            selectBaudrate: (state) => state.baudrate,
            selectConnectionType: (state) => state.connection_type,
            selectFetchingComPorts: (state) => state.fetching_com_ports,
            selectComPorts: (state) => state.com_ports,
            selectSelectedComPorts: (state) => state.selected_com_ports,
            selectNetworkType: (state) => state.network_type,
            selectIp: (state) => state.ip,
            selectPort: (state) => state.port
        }
});

export const {
    // Setters
    setConnecting,
    setConnected,
    setAircraftType,
    setBaudrate,
    setConnectionType,
    setFetchingComPorts,
    setComPorts,
    setSelectedComPorts,
    setNetworkType,
    setIp,
    setPort,

    // Emitters
    emitIsConnectedToDrone
} = droneConnectionSlice.actions;
export const {
    selectConnecting,
    selectConnected,
    selectAircraftType,
    selectBaudrate,
    selectConnectionType,
    selectFetchingComPorts,
    selectComPorts,
    selectSelectedComPorts,
    selectNetworkType,
    selectIp,
selectPort
} = droneConnectionSlice.selectors;


export default droneConnectionSlice
