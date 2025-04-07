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
    connectionType: ConnectionType.Serial, // local

    // com ports
    fetching_com_ports: false,
    com_ports: [],
    selected_com_ports: null,
    
    // network parameters
    networkType: "tcp", // local
    ip: "127.0.0.1", // local
    port: "5760", //local
}

const droneConnectionSlice = createSlice({
    name: "droneConnection",
        initialState,
        reducers: {},
        selectors: {}
});

export {
    // REDUCERS
} = droneConnectionSlice.actions;
export default droneConnectionSlice.reducer;