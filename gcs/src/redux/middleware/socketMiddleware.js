// this redux middleware intercepts all actions from the 

// socket actions
import { 
    initSocket,
    socketConnected,
    socketDisconnected
 } from "../slices/socketSlice";

import { showErrorNotification } from "../../helpers/notification";

// socket factory
import SocketFactory from "../../helpers/socket";

const SocketEvents = Object.freeze({
    // socket.on events
    Connect: "connect",
    Disconnect: "disconnect",

    // droneConnectionSlice
    getComPorts: "get_com_ports",
    isConnectedToDrone: "is_connected_to_drone",
    listComPorts: "list_com_ports",
})

const socketMiddleware = (store) => {
    let socket;

    return (next) => (action) => {
        if (initSocket.match(action)) {
            // client side execution
            if (!socket && typeof window !== "undefined") {
                socket = SocketFactory.create();

                // handle socket connection events 
                // EXAMPLE SOCKET.ON EVENT
                socket.socket.on(SocketEvents.Connect, () => {
                    // DISPATCH ALL ACTIONS HERE
                    // SINCE ITS MIDDLWARE, OTHER FUNCTIONS CAN ALSO BE CALLED
                    console.log(`Connected to socket, ${socket.socket.id}`)
                    store.dispatch(socketConnected());
                })

                socket.socket.on(SocketEvents.Disconnect, () => {
                    console.log(`Disconnected from socket, ${socket.socket.id}`)
                    store.dispatch(socketDisconnected());    
                })
                
            }
            
            
        }
        // these actions handle emitting based on UI events
        // for each action type, emit socket and pass onto reducer
        if (socket) {

            // example
            if (getComPorts.match(action)) socket.socket.emit(SocketEvents.getComPorts) 
        }
        
        next(action);
    }
}

export default socketMiddleware;
