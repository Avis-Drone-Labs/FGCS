// this redux middleware intercepts all actions from the

// socket actions
import {
    initSocket,
    socketConnected,
    socketDisconnected
} from "../slices/socketSlice";

// drone actions
import { emitIsConnectedToDrone, setConnected, setConnecting } from "../slices/droneConnectionSlice";

// socket factory
import SocketFactory from "../../helpers/socket";
import { queueNotification } from "../slices/notificationSlice";
import { setHomePosition } from "../slices/missionSlice";

const SocketEvents = Object.freeze({
    // socket.on events
    Connect: "connect",
    Disconnect: "disconnect",

    // droneConnectionSlice
    // getComPorts: "get_com_ports",
    isConnectedToDrone: "is_connected_to_drone",
    listComPorts: "list_com_ports",
})

const DroneSpecificSocketEvents = Object.freeze({
    onArmDisarm: "arm_disarm",
    onSetCurrentFlightMode: "set_current_flight_mode_result",
    onNavResult: "nav_result",
    onMissionControlResult: "mission_control_result",
    onHomePositionResult: "home_position_result"
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
                    console.log(`Connected to socket from redux, ${socket.socket.id}`)
                    store.dispatch(socketConnected());
                })

                socket.socket.on(SocketEvents.Disconnect, () => {
                    console.log(`Disconnected from socket, ${socket.socket.id}`)
                    store.dispatch(socketDisconnected());
                })

                socket.socket.on("is_connected_to_drone", (msg) => {
                    console.log(msg)
                    if (msg) {
                        setConnected(true)
                    } else {
                        setConnected(false)
                        setConnecting(false)
                        // Get com ports?
                    }
                })
            }
        }

        if (setConnected.match(action)) {
            // Setup socket listeners on drone connection, TODO: add these on connect somehow
            // socket.emit("set_state", { state: "dashboard" })
            // socket.emit("get_home_position")
            // socket.emit("get_current_mission")
            if (action.payload){
                socket.socket.on(DroneSpecificSocketEvents.onArmDisarm, (msg) => {
                    if (!msg.success) store.dispatch(queueNotification({type: 'error', message: msg.message}));
                })
                socket.socket.on(DroneSpecificSocketEvents.onSetCurrentFlightMode, (msg) => {
                    store.dispatch(queueNotification({type: msg.success ? 'success ' : 'error', message: msg.message}))
                })
                socket.socket.on(DroneSpecificSocketEvents.onNavResult, (msg) => {
                    store.dispatch(queueNotification({type: msg.success ? 'success ' : 'error', message: msg.message}))
                })
                socket.socket.on(DroneSpecificSocketEvents.onMissionControlResult, (msg) => {
                    store.dispatch(queueNotification({type: msg.success ? 'success ' : 'error', message: msg.message}))
                })
                socket.socket.on(DroneSpecificSocketEvents.onHomePositionResult, (msg) => {
                    store.dispatch(msg.success ? setHomePosition(msg.data) : queueNotification({type: 'error', message: msg.message}))
                })
            }else{
                Object.values(DroneSpecificSocketEvents).map((event) => socket.socket.off(event));
            }
        }

        // these actions handle emitting based on UI events
        // for each action type, emit socket and pass onto reducer
        if (socket) {
            if (emitIsConnectedToDrone.match(action)) { socket.socket.emit("is_connected_to_drone") };
        }

        next(action);
    }
}

export default socketMiddleware;
