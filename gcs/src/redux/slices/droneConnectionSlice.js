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
    port: "5760", //local
}

const droneConnectionSlice = createSlice({
    name: "droneConnection",
        initialState,
        reducers: {
            // Setters
            setConnecting: (state, action) => {
                if (action.connecting !== state.connecting) { 
                    state.connecting = action.connecting
                }
            },
            setConnected: (state, action) => {
                if (action.connected !== state.connected) { 
                    state.connecting = action.connecting
                }
            },
            setAircraftType: (state, action) => {
                if (action.aircraft_type !== state.aircraft_type) { 
                    state.aircraft_type = action.aircraft_type
                }
            },
            setBaudrate: (state, action) => {
                if (action.baudrate !== state.baudrate) { 
                    state.baudrate = action.baudrate
                }
            },
            setConnectionType: (state, action) => {
                if (action.connection_type !== state.connection_type) { 
                    state.connection_type = action.connection_type
                }
            },
            setFetchingComPorts: (state, action) => {
                if (action.fetching_com_ports !== state.fetching_com_ports) { 
                    state.fetching_com_ports = action.fetching_com_ports 
                }
            },
            setComPorts: (state, action) => {
                if (action.com_ports !== state.com_ports) { 
                    state.com_ports = action.com_ports
                }
            },
            setSelectedComPorts: (state, action) => {
                if (action.selected_com_ports !== state.selected_com_ports) {
                    state.selected_com_ports = action.selected_com_ports
                }
            },
            setNetworkType: (state, action) => {
                if (action.network_type !== state.network_type) {
                    state.network_type = action.network_type
                }
            },
            setIp: (state, action) => {
                if (action.ip !== state.ip) {
                    state.ip = action.ip
                }
            },
            setPort: (state, action) => {
                if (action.port !== state.port) {
                    state.port = action.port
                }
            },

            // Emits
            emitIsConnectedToDrone: () => {}
        },
        selectors: {}
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
export default droneConnectionSlice.reducer;