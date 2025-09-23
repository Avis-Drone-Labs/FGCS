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
import { dataFormatters } from "../../helpers/dataFormatters.js"
import { isGlobalFrameHomeCommand } from "../../helpers/filterMissions.js"
import SocketFactory from "../../helpers/socket"
import {
  setAttitudeData,
  setBatteryData,
  setDroneAircraftType,
  setExtraData,
  setGpsData,
  setGpsRawIntData,
  setGuidedModePinData,
  setHeartbeatData,
  setHomePosition,
  setLastGraphMessage,
  setLoiterRadius,
  setNavControllerOutput,
  setOnboardControlSensorsEnabled,
  setRSSIData,
  setTelemetryData,
} from "../slices/droneInfoSlice"
import {
  addIdToItem,
  closeDashboardMissionFetchingNotificationThunk,
  setCurrentMission,
  setCurrentMissionItems,
  setDrawingFenceItems,
  setDrawingMissionItems,
  setDrawingRallyItems,
  setMissionProgressData,
  setMissionProgressModal,
  setShouldFetchAllMissionsOnDashboard,
  setTargetInfo,
  setUnwrittenChanges,
  setUpdatePlannedHomePositionFromLoadData,
  setUpdatePlannedHomePositionFromLoadModal,
} from "../slices/missionSlice"
import {
  queueErrorNotification,
  queueNotification,
  queueSuccessNotification,
} from "../slices/notificationSlice"
import {
  setAutoPilotRebootModalOpen,
  setFetchingVars,
  setFetchingVarsProgress,
  setModifiedParams,
  setParams,
  setParamSearchValue,
  setRebootData,
  setShownParams,
  updateParamValue,
} from "../slices/paramsSlice.js"
import { pushMessage } from "../slices/statusTextSlice.js"
import { handleEmitters } from "./emitters.js"

const SocketEvents = Object.freeze({
  // socket.on events
  Connect: "connect",
  Disconnect: "disconnect",

  // droneConnectionSlice
  // getComPorts: "get_com_ports",
  isConnectedToDrone: "is_connected_to_drone",
  listComPorts: "list_com_ports",
  linkDebugStats: "link_debug_stats",
})

const DroneSpecificSocketEvents = Object.freeze({
  onDroneError: "drone_error",
  onArmDisarm: "arm_disarm",
  onSetCurrentFlightMode: "set_current_flight_mode_result",
  onNavResult: "nav_result",
  onHomePositionResult: "home_position_result",
  onIncomingMsg: "incoming_msg",
  onNavRepositionResult: "nav_reposition_result",
  onGetLoiterRadiusResult: "nav_get_loiter_radius_result",
  onSetLoiterRadiusResult: "nav_set_loiter_radius_result",
})

const ParamSpecificSocketEvents = Object.freeze({
  onRebootAutopilot: "reboot_autopilot",
  onParamsMessage: "params",
  onParamRequestUpdate: "param_request_update",
  onParamSetSuccess: "param_set_success",
  onParamError: "params_error",
})

const MissionSpecificSocketEvents = Object.freeze({
  onMissionControlResult: "mission_control_result",
  onWriteMissionResult: "write_mission_result",
  onImportMissionResult: "import_mission_result",
  onExportMissionResult: "export_mission_result",
  onCurrentMissionAll: "current_mission_all",
  onCurrentMission: "current_mission",
  onTargetInfo: "target_info",
  onCurrentMissionProgress: "current_mission_progress",
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
          if (msg.aircraft_type !== 1 && msg.aircraft_type !== 2) {
            store.dispatch(
              queueErrorNotification(
                "Aircraft not of type quadcopter or plane",
              ),
            )
          }
          store.dispatch(setConnected(true))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnectionModal(false))

          const currentPage = store.getState().droneConnection.currentPage
          store.dispatch(emitSetState(currentPage))

          if (["dashboard", "missions"].includes(currentPage)) {
            store.dispatch(emitGetHomePosition()) // fetch the actual home position of the drone
            if (msg.aircraft_type === 1) {
              store.dispatch(emitGetLoiterRadius())
            }
          }

          store.dispatch(setGuidedModePinData({ lat: 0, lon: 0, alt: 0 }))
          store.dispatch(setRebootData({}))
          store.dispatch(setAutoPilotRebootModalOpen(false))
          store.dispatch(setShouldFetchAllMissionsOnDashboard(true))
        })

        // Link stats
        socket.socket.on(SocketEvents.linkDebugStats, (msg) => {
          window.ipcRenderer.updateLinkStats(msg)
        })
      }
    }

    if (setConnected.match(action)) {
      // Setup socket listeners on drone connection
      if (action.payload) {
        socket.socket.on(DroneSpecificSocketEvents.onDroneError, (msg) => {
          store.dispatch(queueErrorNotification(msg.message))
        })

        socket.socket.on(DroneSpecificSocketEvents.onArmDisarm, (msg) => {
          if (!msg.success) store.dispatch(queueErrorNotification(msg.message))
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
                ? setHomePosition(msg.data) // use actual home position
                : queueErrorNotification(msg.message),
            )
          },
        )

        socket.socket.on(ParamSpecificSocketEvents.onRebootAutopilot, (msg) => {
          store.dispatch(setRebootData(msg))
          if (msg.success) {
            store.dispatch(setAutoPilotRebootModalOpen(false))
            store.dispatch(queueSuccessNotification(msg.message))
            store.dispatch(setRebootData({}))
          }
        })

        socket.socket.on(ParamSpecificSocketEvents.onParamsMessage, (msg) => {
          store.dispatch(setParams(msg))
          store.dispatch(setShownParams(msg))
          store.dispatch(setFetchingVars(false))
          store.dispatch(setFetchingVarsProgress(0))
          store.dispatch(setParamSearchValue(""))
        })

        socket.socket.on(
          ParamSpecificSocketEvents.onParamRequestUpdate,
          (msg) => {
            store.dispatch(
              setFetchingVarsProgress(
                (msg.current_param_index / msg.total_number_of_params) * 100,
              ),
            )
          },
        )

        socket.socket.on(ParamSpecificSocketEvents.onParamSetSuccess, (msg) => {
          store.dispatch(queueSuccessNotification(msg.message))
          store.dispatch(setModifiedParams([]))
          // Update the param in the params list also
          for (let param of msg.data) {
            store.dispatch(updateParamValue(param))
          }
        })

        socket.socket.on(ParamSpecificSocketEvents.onParamError, (msg) => {
          store.dispatch(queueErrorNotification(msg.message))
          store.dispatch(setFetchingVars(false))
        })

        socket.socket.on(
          DroneSpecificSocketEvents.onNavRepositionResult,
          (msg) => {
            if (msg.success) {
              store.dispatch(queueSuccessNotification(msg.message))
              store.dispatch(setGuidedModePinData(msg.data))
            } else {
              store.dispatch(queueErrorNotification(msg.message))
            }
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onGetLoiterRadiusResult,
          (msg) => {
            store.dispatch(
              msg.success
                ? setLoiterRadius(msg.data)
                : queueErrorNotification(msg.message),
            )
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onSetLoiterRadiusResult,
          (msg) => {
            store.dispatch(
              queueNotification({
                type: msg.success ? "success" : "error",
                message: msg.message,
              }),
            )
          },
        )

        /*
          Missions
        */
        socket.socket.on(
          MissionSpecificSocketEvents.onCurrentMissionAll,
          (msg) => {
            if (!msg.success) {
              store.dispatch(queueErrorNotification(msg.message))
            } else {
              store.dispatch(
                setCurrentMissionItems({
                  missionItems: msg.mission_items,
                  fenceItems: msg.fence_items,
                  rallyItems: msg.rally_items,
                }),
              )
              store.dispatch(setShouldFetchAllMissionsOnDashboard(false))
            }
            store.dispatch(closeDashboardMissionFetchingNotificationThunk())
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onCurrentMission,
          (msg) => {
            // Close modal
            store.dispatch(setMissionProgressModal(false))

            if (msg.success) {
              // Handle each mission item
              const storeState = store.getState()
              if (msg.mission_type === "mission") {
                const missionItemsWithIds = []
                for (let missionItem of msg.items) {
                  missionItemsWithIds.push(addIdToItem(missionItem))
                }

                // Check if first item is a home location, then open modal to
                // select whether to update planned home position
                if (missionItemsWithIds.length > 0) {
                  const potentialHomeLocation = missionItemsWithIds[0]
                  const currentPlannedHomeLocation =
                    storeState.missionInfo.plannedHomePosition

                  // Check if the potential home location is different from the current planned home location
                  if (
                    isGlobalFrameHomeCommand(potentialHomeLocation) &&
                    (potentialHomeLocation.x !==
                      currentPlannedHomeLocation.lat ||
                      potentialHomeLocation.y !==
                        currentPlannedHomeLocation.lon ||
                      potentialHomeLocation.z !==
                        currentPlannedHomeLocation.alt)
                  ) {
                    store.dispatch(
                      setUpdatePlannedHomePositionFromLoadData({
                        lat: potentialHomeLocation.x,
                        lon: potentialHomeLocation.y,
                        alt: potentialHomeLocation.z,
                        from: "drone",
                      }),
                    )
                    store.dispatch(
                      setUpdatePlannedHomePositionFromLoadModal(true),
                    )
                  }
                }
                store.dispatch(setDrawingMissionItems(missionItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    mission: false,
                  }),
                )
              } else if (msg.mission_type === "fence") {
                const fenceItemsWithIds = []
                for (let fence of msg.items) {
                  fenceItemsWithIds.push(addIdToItem(fence))
                }
                store.dispatch(setDrawingFenceItems(fenceItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    fence: false,
                  }),
                )
              } else if (msg.mission_type === "rally") {
                const rallyItemsWithIds = []
                for (let rallyItem of msg.items) {
                  rallyItemsWithIds.push(addIdToItem(rallyItem))
                }
                store.dispatch(setDrawingRallyItems(rallyItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    rally: false,
                  }),
                )
              }

              store.dispatch(
                queueNotification({
                  type: "success",
                  message: `${msg.mission_type} read successfully`,
                }),
              )
            } else {
              store.dispatch(
                queueNotification({ type: "error", message: msg.message }),
              )
            }
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onWriteMissionResult,
          (msg) => {
            store.dispatch(setMissionProgressModal(false))

            const storeState = store.getState()
            if (msg.success) {
              store.dispatch(
                queueNotification({ type: "success", message: msg.message }),
              )
              store.dispatch(
                setUnwrittenChanges({
                  ...storeState.missionInfo.unwrittenChanges,
                  [storeState.missionInfo.activeTab]: false,
                }),
              )
            } else {
              store.dispatch(
                queueNotification({ type: "error", message: msg.message }),
              )
            }
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onImportMissionResult,
          (msg) => {
            if (msg.success) {
              const storeState = store.getState()

              if (msg.mission_type === "mission") {
                const missionItemsWithIds = []
                for (let missionItem of msg.items) {
                  missionItemsWithIds.push(addIdToItem(missionItem))
                }

                // Check if first item is a home location, then open modal to
                // select whether to update planned home position
                if (missionItemsWithIds.length > 0) {
                  const potentialHomeLocation = missionItemsWithIds[0]
                  const currentPlannedHomeLocation =
                    storeState.missionInfo.plannedHomePosition

                  // Check if the potential home location is different from the current planned home location
                  if (
                    isGlobalFrameHomeCommand(potentialHomeLocation) &&
                    (potentialHomeLocation.x !==
                      currentPlannedHomeLocation.lat ||
                      potentialHomeLocation.y !==
                        currentPlannedHomeLocation.lon ||
                      potentialHomeLocation.z !==
                        currentPlannedHomeLocation.alt)
                  ) {
                    store.dispatch(
                      setUpdatePlannedHomePositionFromLoadData({
                        lat: potentialHomeLocation.x,
                        lon: potentialHomeLocation.y,
                        alt: potentialHomeLocation.z,
                        from: "file",
                      }),
                    )
                    store.dispatch(
                      setUpdatePlannedHomePositionFromLoadModal(true),
                    )
                  }
                }
                store.dispatch(setDrawingMissionItems(missionItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    mission: true,
                  }),
                )
              } else if (msg.mission_type === "fence") {
                const fenceItemsWithIds = []
                for (let fence of msg.items) {
                  fenceItemsWithIds.push(addIdToItem(fence))
                }
                store.dispatch(setDrawingFenceItems(fenceItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    fence: true,
                  }),
                )
              } else if (msg.mission_type === "rally") {
                const rallyItemsWithIds = []
                for (let rallyItem of msg.items) {
                  rallyItemsWithIds.push(addIdToItem(rallyItem))
                }

                store.dispatch(setDrawingRallyItems(rallyItemsWithIds))
                store.dispatch(
                  setUnwrittenChanges({
                    ...storeState.missionInfo.unwrittenChanges,
                    rally: true,
                  }),
                )
              }

              store.dispatch(
                queueNotification({ type: "success", message: msg.message }),
              )
            } else {
              store.dispatch(
                queueNotification({ type: "error", message: msg.message }),
              )
            }
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onMissionControlResult,
          (msg) => {
            store.dispatch(
              queueNotification({
                type: msg.success ? "success" : "error",
                message: msg.message,
              }),
            )
          },
        )

        socket.socket.on(MissionSpecificSocketEvents.onTargetInfo, (msg) => {
          store.dispatch(setTargetInfo(msg))
        })

        socket.socket.on(
          MissionSpecificSocketEvents.onExportMissionResult,
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
          MissionSpecificSocketEvents.onCurrentMissionProgress,
          (msg) => {
            store.dispatch(setMissionProgressData(msg))
          },
        )

        /*
          Generic Drone Data
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

          // Handle graph messages
          // Function to get the graph data from a message
          function getGraphDataFromMessage(msg, targetMessageKey) {
            const returnDataArray = []
            for (let graphKey in storeState.droneInfo.graphs.selectedGraphs) {
              const messageKey =
                storeState.droneInfo.graphs.selectedGraphs[graphKey]
              if (messageKey && messageKey.includes(targetMessageKey)) {
                const [, valueName] = messageKey.split(".")

                // Applying Data Formatters
                let formatted_value = msg[valueName]
                if (messageKey in dataFormatters) {
                  formatted_value = dataFormatters[messageKey](
                    msg[valueName].toFixed(3),
                  )
                }

                returnDataArray.push({
                  data: { x: Date.now(), y: formatted_value },
                  graphKey: graphKey,
                })
              }
            }
            if (returnDataArray.length) {
              return returnDataArray
            }
            return false
          }
          store.dispatch(
            setLastGraphMessage(
              getGraphDataFromMessage(msg, msg.mavpackettype),
            ),
          )
        })
      } else {
        // Turn off socket events
        Object.values(DroneSpecificSocketEvents).map((event) =>
          socket.socket.off(event),
        )
        Object.values(ParamSpecificSocketEvents).map((event) =>
          socket.socket.off(event),
        )
        Object.values(MissionSpecificSocketEvents).map((event) =>
          socket.socket.off(event),
        )
      }
    }

    // these actions handle emitting based on UI events
    // for each action type, emit socket and pass onto reducer
    handleEmitters(socket, store, action)

    next(action)
  }
}

export default socketMiddleware
