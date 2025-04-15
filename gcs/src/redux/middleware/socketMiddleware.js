// this redux middleware intercepts all actions from the

// socket actions
import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "../slices/socketSlice"

// drone actions
import {
  emitIsConnectedToDrone,
  setComPorts,
  setConnected,
  setConnecting,
  setConnectionModal,
  setConnectionStatus,
  setFetchingComPorts,
  setSelectedComPorts,
} from "../slices/droneConnectionSlice"

// socket factory
import SocketFactory from "../../helpers/socket"
import { queueErrorNotification, queueNotification } from "../slices/notificationSlice"
import { setHomePosition } from "../slices/missionSlice"
import { setDroneAircraftType } from "../slices/droneInfoSlice"

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
  onHomePositionResult: "home_position_result",
})

const socketMiddleware = (store) => {
  let socket

  return (next) => (action) => {
    if (initSocket.match(action)) {
      // client side execution
      if (!socket && typeof window !== "undefined") {
        socket = SocketFactory.create()

        /*
          ========================
          = UNDERLYING CONNETION =
          ========================
        */

        // handle socket connection events
        // EXAMPLE SOCKET.ON EVENT
        socket.socket.on(SocketEvents.Connect, () => {
          // DISPATCH ALL ACTIONS HERE
          // SINCE ITS MIDDLWARE, OTHER FUNCTIONS CAN ALSO BE CALLED
          console.log(`Connected to socket from redux, ${socket.socket.id}`)
          store.dispatch(socketConnected())
        })

        socket.socket.on(SocketEvents.Disconnect, () => {
          console.log(`Disconnected from socket, ${socket.socket.id}`)
          store.dispatch(socketDisconnected())
        })

        /*
          ====================
          = DRONE CONNETIONS =
          ====================
        */

        socket.socket.on("is_connected_to_drone", (msg) => {
          if (msg) {
            store.dispatch(setConnected(true))
          } else {
            store.dispatch(setConnected(false))
            store.dispatch(setConnecting(false))
            // Get com ports?
            // check if we're connected
            // emit get_com_ports
          }
        })

        socket.socket.on("connected", () => {
          sstore.dispatch(etConnected(true))
        })

        socket.socket.on("disconnect", () => {
          store.dispatch(setConnected(false))
          store.dispatch(setConnecting(false))
        })

        // Fetch com ports and list them
        socket.socket.on("list_com_ports", (msg) => {
          store.dispatch(setFetchingComPorts(false))
          store.dispatch(setComPorts(msg))
          const possibleComPort = msg.find(
            (port) =>
              port.toLowerCase().includes("mavlink") ||
              port.toLowerCase().includes("ardupilot"),
          )
          if (possibleComPort !== undefined) {
            store.dispatch(setSelectedComPorts(possibleComPort))
          } else if (msg.length > 0) {
            store.dispatch(setSelectedComPorts(msg[0]))
          }
        })

        // Flags that the drone is disconnected
        socket.socket.on("disconnected_from_drone", () => {
          store.dispatch(setConnected(false))
        })

        // Flags an error with the com port
        socket.socket.on("connection_error", (msg) => {
          console.log("Connection error: " + msg.message)
          store.dispatch(queueErrorNotification(msg.message))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnected(false))
        })

        // Flags that the drone is connected
        socket.socket.on("connected_to_drone", (msg) => {
          store.dispatch(setDroneAircraftType(msg.aircraft_type)) // There are two aircraftTypes, make sure to not use FLA one haha :D
          if (msg.aircraft_type != 1 && msg.aircraft_type != 2) {
            store.dispatch(queueErrorNotification("Aircraft not of type quadcopter or plane"))
          }
          store.dispatch(setConnected(true))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnectionModal(false))
        })

        // Setting connection status 
        socket.socket.on("drone_connect_status", (msg) => {
          store.dispatch(setConnectionStatus(msg.message))
        })
      }
    }

    if (setConnected.match(action)) {
      // Setup socket listeners on drone connection, TODO: add these on connect somehow
      // socket.emit("set_state", { state: "dashboard" })
      // socket.emit("get_home_position")
      // socket.emit("get_current_mission")
      if (action.payload) {
        socket.socket.on(DroneSpecificSocketEvents.onArmDisarm, (msg) => {
          if (!msg.success)
            store.dispatch(
              queueNotification({ type: "error", message: msg.message }),
            )
        })
        socket.socket.on(
          DroneSpecificSocketEvents.onSetCurrentFlightMode,
          (msg) => {
            store.dispatch(
              queueNotification({
                type: msg.success ? "success " : "error",
                message: msg.message,
              }),
            )
          },
        )
        socket.socket.on(DroneSpecificSocketEvents.onNavResult, (msg) => {
          store.dispatch(
            queueNotification({
              type: msg.success ? "success " : "error",
              message: msg.message,
            }),
          )
        })
        socket.socket.on(
          DroneSpecificSocketEvents.onMissionControlResult,
          (msg) => {
            store.dispatch(
              queueNotification({
                type: msg.success ? "success " : "error",
                message: msg.message,
              }),
            )
          },
        )
        socket.socket.on(
          DroneSpecificSocketEvents.onHomePositionResult,
          (msg) => {
            store.dispatch(
              msg.success
                ? setHomePosition(msg.data)
                : queueNotification({ type: "error", message: msg.message }),
            )
          },
        )
      } else {
        Object.values(DroneSpecificSocketEvents).map((event) =>
          socket.socket.off(event),
        )
      }
    }

    // these actions handle emitting based on UI events
    // for each action type, emit socket and pass onto reducer
    if (socket) {
      if (emitIsConnectedToDrone.match(action)) {
        socket.socket.emit("is_connected_to_drone")
      }
    }

    next(action)
  }
}

export default socketMiddleware
