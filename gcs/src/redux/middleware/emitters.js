import {
  emitConnectToDrone,
  emitDisconnectFromDrone,
  emitGetComPorts,
  emitGetCurrentMissionAll,
  emitGetHomePosition,
  emitGetLoiterRadius,
  emitIsConnectedToDrone,
  emitSetState,
  setState,
} from "../slices/droneConnectionSlice"
import {
  emitExportMissionToFile,
  emitGetCurrentMission,
  emitGetTargetInfo,
  emitImportMissionFromFile,
  emitWriteCurrentMission,
} from "../slices/missionSlice"
import {
  emitRebootAutopilot,
  emitRefreshParams,
  emitSetMultipleParams,
} from "../slices/paramsSlice"

export function handleEmitters(socket, store, action) {
  if (!socket) return
  const emitHandlers = [
    /*
      ====================
      = DRONE CONNECTION =
      ====================
    */
    {
      emitter: emitIsConnectedToDrone,
      callback: () => socket.socket.emit("is_connected_to_drone"),
    },
    {
      emitter: emitGetComPorts,
      callback: () => socket.socket.emit("get_com_ports"),
    },
    {
      emitter: emitDisconnectFromDrone,
      callback: () => socket.socket.emit("disconnect_from_drone"),
    },
    {
      emitter: emitConnectToDrone,
      callback: () => socket.socket.emit("connect_to_drone", action.payload),
    },
    {
      emitter: emitSetState,
      callback: () => {
        store.dispatch(setState(action.payload)) // Update Redux state
        socket.socket.emit("set_state", action.payload) // Emit to socket
      },
    },
    {
      emitter: emitGetHomePosition,
      callback: () => socket.socket.emit("get_home_position"),
    },
    {
      emitter: emitGetCurrentMissionAll,
      callback: () => socket.socket.emit("get_current_mission_all"),
    },
    {
      emitter: emitGetLoiterRadius,
      callback: () => socket.socket.emit("get_loiter_radius"),
    },

    /*
      ============
      = MISSIONS =
      ============
    */
    {
      emitter: emitGetTargetInfo,
      callback: () => socket.socket.emit("get_target_info"),
    },
    {
      emitter: emitGetCurrentMission,
      callback: () => {
        const storeState = store.getState()
        socket.socket.emit("get_current_mission", {
          type: storeState.missionInfo.activeTab,
        })
      },
    },
    {
      emitter: emitWriteCurrentMission,
      callback: () => {
        socket.socket.emit("write_current_mission", {
          type: action.payload.type,
          items: action.payload.items,
        })
      },
    },
    {
      emitter: emitImportMissionFromFile,
      callback: () => {
        socket.socket.emit("import_mission_from_file", {
          type: action.payload.type,
          file_path: action.payload.file_path,
        })
      },
    },
    {
      emitter: emitExportMissionToFile,
      callback: () => {
        socket.socket.emit("export_mission_to_file", {
          type: action.payload.type,
          file_path: action.payload.file_path,
          items: action.payload.items,
        })
      },
    },

    /*
      ==========
      = PARAMS =
      ==========
    */
    {
      emitter: emitRebootAutopilot,
      callback: () => socket.socket.emit("reboot_autopilot"),
    },
    {
      emitter: emitRefreshParams,
      callback: () => socket.socket.emit("refresh_params"),
    },
    {
      emitter: emitSetMultipleParams,
      callback: () => socket.socket.emit("set_multiple_params", action.payload),
    },
  ]

  for (const { emitter, callback } of emitHandlers) {
    if (emitter.match(action)) {
      callback()
      break
    }
  }
}
