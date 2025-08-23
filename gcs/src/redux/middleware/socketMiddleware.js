// this redux middleware intercepts all actions from the

// socket actions
import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "../slices/socketSlice"

// drone actions
import {
  emitGetComPorts,
  emitGetHomePosition,
  emitIsConnectedToDrone,
  emitSetState,
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
import {
  queueErrorNotification,
  queueNotification,
} from "../slices/notificationSlice"
import {
  addIdToItem,
  setCurrentMission,
  setCurrentMissionItems,
  setDrawingFenceItems,
  setDrawingMissionItems,
  setDrawingRallyItems,
  setHomePosition,
  setMissionProgressModal,
  setTargetInfo,
  setUnwrittenChanges,
  updateHomePositionBasedOnWaypoints,
} from "../slices/missionSlice"
import {
  setDroneAircraftType,
  setTelemetryData,
  setAttitudeData,
  setGpsData,
  setNavControllerOutput,
  setHeartbeatData,
  setGpsRawIntData,
  setBatteryData,
  setOnboardControlSensorsEnabled,
  setRSSIData,
  setExtraData,
} from "../slices/droneInfoSlice"
import { pushMessage } from "../slices/statusTextSlice.js"

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
  onIncomingMsg: "incoming_msg",
  onCurrentMissionAll: "current_mission_all",
  onCurrentMission: "current_mission",
  onTargetInfo: "target_info",
  onWriteMissionResult: "write_mission_result"
})

const socketMiddleware = (store) => {
  let socket

  const incomingMessageHandler = (msg) => {
    switch (msg.mavpackettype) {
      case "VFR_HUD":
        store.dispatch(setTelemetryData(msg))
        break
      case "ATTITUDE":
        store.dispatch(setAttitudeData(msg))
        break
      case "GLOBAL_POSITION_INT":
        store.dispatch(setGpsData(msg))
        break
      case "NAV_CONTROLLER_OUTPUT":
        store.dispatch(setNavControllerOutput(msg))
        break
      case "HEARTBEAT":
        store.dispatch(setHeartbeatData(msg))
        break
      case "STATUSTEXT":
        store.dispatch(pushMessage(msg))
        break
      case "SYS_STATUS":
        store.dispatch(
          setOnboardControlSensorsEnabled(msg.onboard_control_sensors_enabled),
        )
        break
      case "GPS_RAW_INT":
        store.dispatch(setGpsRawIntData(msg))
        break
      case "RC_CHANNELS":
        // NOTE: UNABLE TO TEST IN SIMULATOR!
        store.dispatch(setRSSIData(msg.rssi))
        break
      case "MISSION_CURRENT":
        store.dispatch(setCurrentMission(msg))
        break
      case "BATTERY_STATUS":
        store.dispatch(setBatteryData(msg))
        break
    }
  }

  return (next) => (action) => {
    if (initSocket.match(action)) {
      // client side execution
      if (!socket && typeof window !== "undefined") {
        socket = SocketFactory.create()

        /*
          ========================
          = UNDERLYING CONNECTION =
          ========================
        */

        // handle socket connection events
        // EXAMPLE SOCKET.ON EVENT
        socket.socket.on(SocketEvents.Connect, () => {
          // DISPATCH ALL ACTIONS HERE
          // SINCE IT'S MIDDLEWARE, OTHER FUNCTIONS CAN ALSO BE CALLED
          console.log(`Connected to socket from redux, ${socket.socket.id}`)
          store.dispatch(socketConnected())
          store.dispatch(emitIsConnectedToDrone())
        })

        socket.socket.on(SocketEvents.Disconnect, () => {
          console.log(`Disconnected from socket via redux, ${socket.socket.id}`)
          store.dispatch(socketDisconnected())
        })

        /*
          ====================
          = DRONE CONNECTIONS =
          ====================
        */

        socket.socket.on("connected", () => {
          store.dispatch(setConnected(true))
        })

        socket.socket.on("disconnect", () => {
          store.dispatch(setConnected(false))
          store.dispatch(setConnecting(false))
        })

        socket.socket.on("is_connected_to_drone", (msg) => {
          if (msg) {
            store.dispatch(setConnected(true))
          } else {
            store.dispatch(setConnected(false))
            store.dispatch(setConnecting(false))
            store.dispatch(emitGetComPorts())
          }
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

        // Setting connection status
        socket.socket.on("drone_connect_status", (msg) => {
          store.dispatch(setConnectionStatus(msg.message))
        })

        // Flags that the drone is connected
        socket.socket.on("connected_to_drone", (msg) => {
          store.dispatch(setDroneAircraftType(msg.aircraft_type)) // There are two aircraftTypes, make sure to not use FLA one haha :D
          if (msg.aircraft_type != 1 && msg.aircraft_type != 2) {
            store.dispatch(
              queueErrorNotification(
                "Aircraft not of type quadcopter or plane",
              ),
            )
          }
          store.dispatch(setConnected(true))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnectionModal(false))

          store.dispatch(emitSetState({ state: "dashboard" }))
          store.dispatch(emitGetHomePosition())
        })
      }
    }

    if (setConnected.match(action)) {
      // Setup socket listeners on drone connection
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
                type: msg.success ? "success" : "error",
                message: msg.message,
              }),
            )
          },
        )

        socket.socket.on(DroneSpecificSocketEvents.onNavResult, (msg) => {
          store.dispatch(
            queueNotification({
              type: msg.success ? "success" : "error",
              message: msg.message,
            }),
          )
        })

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

        /*
          Missions
        */
        socket.socket.on(
          DroneSpecificSocketEvents.onCurrentMissionAll,
          (msg) => {
            store.dispatch(setCurrentMissionItems(msg))
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onCurrentMission,
          (msg) => {
            if (msg.success) {
              // Close modal
              store.dispatch(setMissionProgressModal(false))

              // Handle each mission item
              const storeState = store.getState()
              if (msg.mission_type === "mission") {
                const missionItemsWithIds = []
                for (let missionItem of msg.items) {
                  missionItemsWithIds.push(addIdToItem(missionItem))
                }
                updateHomePositionBasedOnWaypoints(missionItemsWithIds)
                store.dispatch(setDrawingMissionItems(missionItemsWithIds))
                store.dispatch(setUnwrittenChanges({ ...storeState.missionInfo.unwrittenChanges, mission: false }))
              } else if (msg.mission_type === "fence") {
                const fenceItemsWithIds = []
                for (let fence of msg.items) {
                  fenceItemsWithIds.push(addIdToItem(fence))
                }
                store.dispatch(setDrawingFenceItems(fenceItemsWithIds))
                store.dispatch(setUnwrittenChanges({ ...storeState.missionInfo.unwrittenChanges, fence: false }))
              } else if (msg.mission_type === "rally") {
                const rallyItemsWithIds = []
                for (let rallyItem of msg.items) {
                  rallyItemsWithIds.push(addIdToItem(rallyItem))
                }
                store.dispatch(setDrawingRallyItems(rallyItemsWithIds))
                store.dispatch(setUnwrittenChanges({ ...storeState.missionInfo.unwrittenChanges, rally: false }))
              }

              store.dispatch(queueNotification({ type: "success", message: `${msg.mission_type} read successfully` }))
            } else {
              store.dispatch(queueNotification({ type: "error", message: msg.message }))
            } 
          }
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onWriteMissionResult,
          (msg) => {
            store.dispatch(setMissionProgressModal(false))
            
            const storeState = store.getState()
            if (msg.success) {
              store.dispatch(queueNotification({ type: "success", message: msg.message }))
              store.dispatch(setUnwrittenChanges({
                ...storeState.missionInfo.unwrittenChanges,
                [storeState.missionInfo.activeTab]: false,
              }))
            } else {
              store.dispatch(queueNotification({ type: "error", message: msg.message }))
            }
          }
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onMissionControlResult,
          (msg) => {
            store.dispatch(
              queueNotification({
                type: msg.success ? "success" : "error",
                message: msg.message,
              }),
            )
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onTargetInfo,
          (msg) => {
            store.dispatch(setTargetInfo(msg))
          }
        )

        /*
          Generic Drone Date
        */
        socket.socket.on(DroneSpecificSocketEvents.onIncomingMsg, (msg) => {
          incomingMessageHandler(msg)

          // Data points on dashboard, the below code updates the value in the store when a new message
          // comes in in the type of specificData.
          const packetType = msg.mavpackettype
          const storeState = store.getState()
          if (storeState !== undefined) {
            const extraDroneData = storeState.droneInfo.extraDroneData
            const updatedExtraDroneData = extraDroneData.map((dataItem) => {
              if (dataItem.currently_selected.startsWith(packetType)) {
                const specificData = dataItem.currently_selected.split(".")[1]
                if (Object.prototype.hasOwnProperty.call(msg, specificData)) {
                  return { ...dataItem, value: msg[specificData] }
                }
              }
              return dataItem
            })

            store.dispatch(setExtraData(updatedExtraDroneData))
          }
        })
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
