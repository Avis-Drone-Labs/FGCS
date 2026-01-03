// this redux middleware intercepts all actions from the

// socket actions
import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "../slices/socketSlice"

// drone actions
import {
  ConnectionType,
  emitConnectToDrone,
  emitGetComPorts,
  emitIsConnectedToDrone,
  setComPorts,
  setConnected,
  setConnecting,
  setConnectionModal,
  setConnectionStatus,
  setFetchingComPorts,
  setForceDisarmModalOpened,
  setSelectedComPorts,
  setSimulationStatus,
  SimulationStatus,
} from "../slices/droneConnectionSlice"

// socket factory
import { dataFormatters } from "../../helpers/dataFormatters.js"
import { isGlobalFrameHomeCommand } from "../../helpers/filterMissions.js"
import { FRAME_CLASS_MAP } from "../../helpers/mavlinkConstants.js"
import {
  showErrorNotification,
  showSuccessNotification,
  showWarningNotification,
} from "../../helpers/notification.js"
import SocketFactory from "../../helpers/socket"
import {
  emitGetFlightModeConfig,
  setChannelsConfig,
  setCurrentPwmValue,
  setFlightModeChannel,
  setFlightModesList,
  setFrameClass,
  setFrameTypeDirection,
  setFrameTypeName,
  setFrameTypeOrder,
  setGetGripperEnabled,
  setGripperConfig,
  setNumberOfMotors,
  setRadioPwmChannels,
  setRefreshingFlightModeData,
  setRefreshingGripperConfigData,
  setShowMotorTestWarningModal,
  updateChannelsConfigParam,
  updateGripperConfigParam,
} from "../slices/configSlice.js"
import {
  appendToGpsTrack,
  calculateGpsTrackHeadingThunk,
  resetGpsTrack,
  setAttitudeData,
  setBatteryData,
  setDroneAircraftType,
  setEkfStatusReportData,
  setExtraData,
  setFlightSwVersion,
  setGps2RawIntData,
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
  setVibrationData,
} from "../slices/droneInfoSlice"
import {
  addFiles,
  resetFiles,
  setLoadingListFiles,
} from "../slices/ftpSlice.js"
import {
  addIdToItem,
  closeDashboardMissionFetchingNotificationNoSuccessThunk,
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
  resetParamsWriteProgressData,
  setAutoPilotRebootModalOpen,
  setFetchingVars,
  setFetchingVarsProgress,
  setHasFetchedOnce,
  setModifiedParams,
  setParams,
  setParamSearchValue,
  setParamsFailedToWrite,
  setParamsFailedToWriteModalOpen,
  setParamsWriteProgressData,
  setParamsWriteProgressModalOpen,
  setRebootData,
  setShownParams,
  updateParamValue,
} from "../slices/paramsSlice.js"
import { pushMessage, resetMessages } from "../slices/statusTextSlice.js"
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
  onSimulationResult: "simulation_result",
})

const DroneSpecificSocketEvents = Object.freeze({
  onForwardingStatus: "forwarding_status",
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
  onExportParamsResult: "export_params_result",
  onSetMultipleParamsProgress: "set_multiple_params_progress",
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

const ConfigSpecificSocketEvents = Object.freeze({
  onGripperEnabled: "is_gripper_enabled",
  onSetGripperResult: "set_gripper_result",
  onGripperConfig: "gripper_config",
  setGripperParamResult: "set_gripper_param_result",
  onMotorTestResult: "motor_test_result",
  onFlightModeConfig: "flight_mode_config",
  onSetFlightModeResult: "set_flight_mode_result",
  onFrameTypeConfig: "frame_type_config",
  onRcConfig: "rc_config",
  onSetRcConfigResult: "set_rc_config_result",
})

const FtpSpecificSocketEvents = Object.freeze({
  onListFilesResult: "list_files_result",
})

const socketMiddleware = (store) => {
  let socket

  function handleRcChannels(msg) {
    let chans = {}
    const chanCount = msg.chancount || 16 // default to 16 channels if chancount is 0
    for (let i = 1; i < chanCount + 1; i++) {
      chans[i] = msg[`chan${i}_raw`]
    }

    store.dispatch(setRadioPwmChannels(chans))
  }

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
        store.dispatch(
          appendToGpsTrack({
            lat: msg.lat,
            lon: msg.lon,
          }),
        )
        store.dispatch(calculateGpsTrackHeadingThunk())
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
      case "GPS_RAW_INT": {
        // MAVLink GPS_RAW_INT provides 'eph' (HDOP * 100).
        const hdop = msg.eph != null ? msg.eph / 100.0 : null

        store.dispatch(
          setGpsRawIntData({
            ...msg,
            hdop,
          }),
        )
        store.dispatch(calculateGpsTrackHeadingThunk())
        break
      }
      case "GPS2_RAW": {
        // MAVLink GPS2_RAW provides 'eph' (HDOP * 100).
        const hdop = msg.eph != null ? msg.eph / 100.0 : null

        store.dispatch(
          setGps2RawIntData({
            ...msg,
            hdop,
          }),
        )
        break
      }
      case "RC_CHANNELS":
        // NOTE: UNABLE TO TEST IN SIMULATOR!
        store.dispatch(setRSSIData(msg.rssi))
        handleRcChannels(msg)
        break
      case "MISSION_CURRENT":
        store.dispatch(setCurrentMission(msg))
        break
      case "BATTERY_STATUS":
        store.dispatch(setBatteryData(msg))
        break
      case "EKF_STATUS_REPORT": {
        const data = {
          compass_variance: msg.compass_variance,
          pos_horiz_variance: msg.pos_horiz_variance,
          pos_vert_variance: msg.pos_vert_variance,
          terrain_alt_variance: msg.terrain_alt_variance,
          velocity_variance: msg.velocity_variance,
          flags: msg.flags,
        }
        store.dispatch(setEkfStatusReportData(data))
        window.ipcRenderer.invoke("app:update-ekf-status", data)
        break
      }
      case "VIBRATION": {
        const data = {
          vibration_x: msg.vibration_x,
          vibration_y: msg.vibration_y,
          vibration_z: msg.vibration_z,
          clipping_0: msg.clipping_0,
          clipping_1: msg.clipping_1,
          clipping_2: msg.clipping_2,
        }
        store.dispatch(setVibrationData(data))
        window.ipcRenderer.invoke("app:update-vibe-status", data)
        break
      }
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
            store.dispatch(
              closeDashboardMissionFetchingNotificationNoSuccessThunk(),
            )
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
          if (!store.getState().droneConnection.selected_com_ports) {
            // If no com port is selected, select a possible mavlink/ardupilot port if it exists, otherwise select the first port
            if (possibleComPort !== undefined) {
              store.dispatch(setSelectedComPorts(possibleComPort))
            } else if (msg.length > 0) {
              store.dispatch(setSelectedComPorts(msg[0]))
            }
          }
        })

        // Flags that the drone is disconnected
        socket.socket.on("disconnected_from_drone", () => {
          store.dispatch(setConnected(false))
          window.ipcRenderer.send("window:update-title", "FGCS")
        })

        // Flags an error with the com port
        socket.socket.on("connection_error", (msg) => {
          console.error("Connection error: " + msg.message)
          showErrorNotification(msg.message)
          store.dispatch(setConnecting(false))
          store.dispatch(setConnected(false))
        })

        // Setting connection status
        socket.socket.on("drone_connect_status", (msg) => {
          store.dispatch(
            setConnectionStatus({
              message: msg.message,
              progress: msg.progress,
            }),
          )
        })

        // Flags that the drone is connected
        socket.socket.on("connected_to_drone", (msg) => {
          store.dispatch(setDroneAircraftType(msg.aircraft_type)) // There are two aircraftTypes, make sure to not use FLA one haha :D
          if (msg.aircraft_type !== 1 && msg.aircraft_type !== 2) {
            showErrorNotification("Aircraft not of type quadcopter or plane")
          }

          store.dispatch(setFlightSwVersion(msg.flight_sw_version))
          store.dispatch(setConnected(true))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnectionModal(false))

          store.dispatch(setHasFetchedOnce(false))
          store.dispatch(setGuidedModePinData({ lat: 0, lon: 0, alt: 0 }))
          store.dispatch(setRebootData({}))
          store.dispatch(setAutoPilotRebootModalOpen(false))
          store.dispatch(setShouldFetchAllMissionsOnDashboard(true))
          store.dispatch(setShowMotorTestWarningModal(true))
          store.dispatch(resetMessages())
          store.dispatch(resetGpsTrack())
          store.dispatch(resetFiles())
        })

        // Simulation messages
        socket.socket.on(SocketEvents.onSimulationResult, (msg) => {
          if (msg.running === true) {
            store.dispatch(setSimulationStatus(SimulationStatus.Running))
          } else if (msg.running === false) {
            store.dispatch(setSimulationStatus(SimulationStatus.Idle))
          }
          // Else assume status unchanged

          msg.success
            ? showSuccessNotification(msg.message)
            : showErrorNotification(msg.message)

          if (msg.connect) {
            const storeState = store.getState()
            if (storeState.droneConnection.simParams.connectAfterStart) {
              const port = storeState.droneConnection.simParams.port
              store.dispatch(
                emitConnectToDrone({
                  port: `tcp:127.0.0.1:${port}`,
                  baud: 115200,
                  wireless: true,
                  connectionType: ConnectionType.Network,
                  forwardingAddress:
                    storeState.droneConnection.forwardingAddress,
                }),
              )
            }
          }
        })

        // Link stats
        socket.socket.on(SocketEvents.linkDebugStats, (msg) => {
          window.ipcRenderer.invoke("app:update-link-stats", msg)
        })

        /*
          Telemetry Socket Connection Events
        */
        socket.telemetrySocket.on("connect", () => {
          console.log(
            `Connected to telemetry socket: ${socket.telemetrySocket.id}`,
          )
        })

        socket.telemetrySocket.on("disconnect", () => {
          console.log(
            `Disconnected from telemetry socket: ${socket.telemetrySocket.id}`,
          )
        })

        // I don't understand whatsoever why this doesn't work with the standard
        // on method.
        socket.telemetrySocket.onAny((eventName, ...args) => {
          if (eventName !== DroneSpecificSocketEvents.onIncomingMsg) {
            return
          }

          const msg = args[0]

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

          // Handle Flight Mode incoming data
          if (
            msg.mavpackettype === "RC_CHANNELS" &&
            storeState.config.flightModeChannel !== "UNKNOWN"
          ) {
            store.dispatch(
              setCurrentPwmValue(
                msg[`chan${storeState.config.flightModeChannel}_raw`],
              ),
            )
          }
        })
      }
    }

    if (setConnected.match(action)) {
      // Setup socket listeners on drone connection
      if (action.payload) {
        socket.socket.on(
          DroneSpecificSocketEvents.onForwardingStatus,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(DroneSpecificSocketEvents.onDroneError, (msg) => {
          showErrorNotification(msg.message)
        })

        socket.socket.on(DroneSpecificSocketEvents.onArmDisarm, (msg) => {
          if (!msg.success) {
            // Check if this was a disarm attempt and was not a force disarm
            if (msg.data?.was_disarming && !msg.data?.was_force) {
              store.dispatch(setForceDisarmModalOpened(true))
            } else {
              showErrorNotification(msg.message)
            }
          }
        })

        socket.socket.on(
          DroneSpecificSocketEvents.onSetCurrentFlightMode,
          (msg) => {
            msg.success
              ? showSuccessNotification(msg.message)
              : showErrorNotification(msg.message)
          },
        )

        socket.socket.on(DroneSpecificSocketEvents.onNavResult, (msg) => {
          msg.success
            ? showSuccessNotification(msg.message)
            : showErrorNotification(msg.message)
        })

        socket.socket.on(
          DroneSpecificSocketEvents.onHomePositionResult,
          (msg) => {
            if (msg.success) {
              store.dispatch(setHomePosition(msg.data)) // use actual home position
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(ParamSpecificSocketEvents.onRebootAutopilot, (msg) => {
          store.dispatch(setRebootData(msg))
          if (msg.success) {
            store.dispatch(setAutoPilotRebootModalOpen(false))
            showSuccessNotification(msg.message)
            store.dispatch(setRebootData({}))
          }
        })

        socket.socket.on(ParamSpecificSocketEvents.onParamsMessage, (msg) => {
          store.dispatch(setParams(msg))
          store.dispatch(setShownParams(msg))
          store.dispatch(setFetchingVars(false))
          store.dispatch(setFetchingVarsProgress({ progress: 0, param_id: "" }))
          store.dispatch(setParamSearchValue(""))
        })

        socket.socket.on(
          ParamSpecificSocketEvents.onParamRequestUpdate,
          (msg) => {
            store.dispatch(
              setFetchingVarsProgress({
                progress:
                  (msg.current_param_index / msg.total_number_of_params) * 100,
                param_id: msg.current_param_id,
              }),
            )
          },
        )

        socket.socket.on(ParamSpecificSocketEvents.onParamSetSuccess, (msg) => {
          const paramsSetSuccessfully = msg.data.params_set_successfully
          const paramsNotSet = msg.data.params_could_not_set
          if (paramsNotSet.length > 0 && paramsSetSuccessfully.length > 0) {
            showWarningNotification(msg.message)
          } else if (paramsNotSet.length > 0) {
            showErrorNotification(msg.message)
          } else {
            showSuccessNotification(msg.message)
          }

          const modifiedParams = store.getState().paramsSlice.modifiedParams

          // Only clear the params that got set successfully
          store.dispatch(
            setModifiedParams(
              modifiedParams.filter(
                (param) =>
                  !paramsSetSuccessfully.some(
                    (setParam) => setParam.param_id === param.param_id,
                  ),
              ),
            ),
          )

          // Update the param in the params list also
          for (let param of paramsSetSuccessfully) {
            store.dispatch(updateParamValue(param))
          }

          store.dispatch(resetParamsWriteProgressData())
          store.dispatch(setParamsWriteProgressModalOpen(false))

          if (paramsNotSet.length !== 0) {
            store.dispatch(setParamsFailedToWrite(paramsNotSet))
            store.dispatch(setParamsFailedToWriteModalOpen(true))
          }
        })

        socket.socket.on(ParamSpecificSocketEvents.onParamError, (msg) => {
          showErrorNotification(msg.message)
          store.dispatch(setFetchingVars(false))
          store.dispatch(resetParamsWriteProgressData())
          store.dispatch(setParamsWriteProgressModalOpen(false))
        })

        socket.socket.on(
          ParamSpecificSocketEvents.onExportParamsResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          ParamSpecificSocketEvents.onSetMultipleParamsProgress,
          (msg) => {
            store.dispatch(
              setParamsWriteProgressData({
                message: msg.message,
                param_id: msg.param_id,
                current_index: msg.current_index,
                total_params: msg.total_params,
              }),
            )
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onNavRepositionResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
              store.dispatch(setGuidedModePinData(msg.data))
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onGetLoiterRadiusResult,
          (msg) => {
            if (msg.success) {
              store.dispatch(setLoiterRadius(msg.data))
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          DroneSpecificSocketEvents.onSetLoiterRadiusResult,
          (msg) => {
            msg.success
              ? showSuccessNotification(msg.message)
              : showErrorNotification(msg.message)
          },
        )

        /*
          Missions
        */
        socket.socket.on(
          MissionSpecificSocketEvents.onCurrentMissionAll,
          (msg) => {
            if (!msg.success) {
              showErrorNotification(msg.message)
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

              showSuccessNotification(`${msg.mission_type} read successfully`)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onWriteMissionResult,
          (msg) => {
            store.dispatch(setMissionProgressModal(false))

            const storeState = store.getState()
            if (msg.success) {
              showSuccessNotification(msg.message)
              store.dispatch(
                setUnwrittenChanges({
                  ...storeState.missionInfo.unwrittenChanges,
                  [storeState.missionInfo.activeTab]: false,
                }),
              )
            } else {
              showErrorNotification(msg.message)
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

              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onMissionControlResult,
          (msg) => {
            msg.success
              ? showSuccessNotification(msg.message)
              : showErrorNotification(msg.message)
          },
        )

        socket.socket.on(MissionSpecificSocketEvents.onTargetInfo, (msg) => {
          store.dispatch(setTargetInfo(msg))
        })

        socket.socket.on(
          MissionSpecificSocketEvents.onExportMissionResult,
          (msg) => {
            msg.success
              ? showSuccessNotification(msg.message)
              : showErrorNotification(msg.message)
          },
        )

        socket.socket.on(
          MissionSpecificSocketEvents.onCurrentMissionProgress,
          (msg) => {
            store.dispatch(setMissionProgressData(msg))
          },
        )

        /*
          ==========
          = CONFIG =
          ==========
        */
        socket.socket.on(
          ConfigSpecificSocketEvents.onGripperEnabled,
          (enabled) => {
            store.dispatch(setGetGripperEnabled(enabled))
          },
        )

        socket.socket.on(
          ConfigSpecificSocketEvents.onSetGripperResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(ConfigSpecificSocketEvents.onGripperConfig, (msg) => {
          store.dispatch(setGripperConfig(msg.params))
          store.dispatch(setRefreshingGripperConfigData(false))
        })

        socket.socket.on(
          ConfigSpecificSocketEvents.setGripperParamResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
              store.dispatch(
                updateGripperConfigParam({
                  param_id: msg.param_id,
                  value: msg.value,
                }),
              )
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          ConfigSpecificSocketEvents.onMotorTestResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(
          ConfigSpecificSocketEvents.onFlightModeConfig,
          (msg) => {
            store.dispatch(setFlightModesList(msg.flight_modes))
            store.dispatch(setFlightModeChannel(msg.flight_mode_channel))
            store.dispatch(setRefreshingFlightModeData(false))
          },
        )

        socket.socket.on(
          ConfigSpecificSocketEvents.onSetFlightModeResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }

            store.dispatch(emitGetFlightModeConfig())
          },
        )

        socket.socket.on(
          ConfigSpecificSocketEvents.onFrameTypeConfig,
          (msg) => {
            const currentFrameType = msg.frame_type
            const currentFrameClass = msg.frame_class

            // Checks if the frame class has any compatible frame types and if the current frame type param is compatible
            if (FRAME_CLASS_MAP[currentFrameClass].frametype) {
              if (
                Object.keys(
                  FRAME_CLASS_MAP[currentFrameClass].frametype,
                ).includes(currentFrameType.toString())
              ) {
                const frameInfo =
                  FRAME_CLASS_MAP[currentFrameClass].frametype[currentFrameType]
                store.dispatch(setFrameTypeDirection(frameInfo.direction))
                store.dispatch(setFrameTypeOrder(frameInfo.motorOrder))
                store.dispatch(setFrameTypeName(frameInfo.frametypename))
              }
            } else {
              store.dispatch(setFrameTypeDirection(null))
              store.dispatch(setFrameTypeOrder(null))
              store.dispatch(setFrameTypeName(currentFrameType))
            }
            store.dispatch(
              setFrameClass(FRAME_CLASS_MAP[currentFrameClass].name),
            )
            store.dispatch(
              setNumberOfMotors(
                FRAME_CLASS_MAP[currentFrameClass].numberOfMotors,
              ),
            )
          },
        )

        socket.socket.on(ConfigSpecificSocketEvents.onRcConfig, (msg) => {
          const config = {}

          for (let i = 1; i < 17; i++) {
            config[i] = msg[`RC_${i}`]
          }
          config[`${msg.pitch}`].map = "Pitch"
          config[`${msg.roll}`].map = "Roll"
          config[`${msg.throttle}`].map = "Throttle"
          config[`${msg.yaw}`].map = "Yaw"
          config[`${msg.flight_modes}`].map = "Flight modes"

          store.dispatch(setChannelsConfig(config))
        })

        socket.socket.on(
          ConfigSpecificSocketEvents.onSetRcConfigResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
              store.dispatch(
                updateChannelsConfigParam({
                  param_id: msg.param_id,
                  value: msg.value,
                }),
              )
            } else {
              showErrorNotification(msg.message)
            }
          },
        )

        socket.socket.on(FtpSpecificSocketEvents.onListFilesResult, (msg) => {
          store.dispatch(setLoadingListFiles(false))
          if (msg.success) {
            store.dispatch(addFiles(msg.data))
          } else {
            showErrorNotification(msg.message)
          }
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
        Object.values(ConfigSpecificSocketEvents).map((event) =>
          socket.socket.off(event),
        )

        // Turn off telemetry socket events
        socket.telemetrySocket.off(DroneSpecificSocketEvents.onIncomingMsg)
      }
    }

    // these actions handle emitting based on UI events
    // for each action type, emit socket and pass onto reducer
    handleEmitters(socket, store, action)

    next(action)
  }
}

export default socketMiddleware
