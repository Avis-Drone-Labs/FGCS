import {
  emitArmDisarm,
  emitConnectToDrone,
  emitDisconnectFromDrone,
  emitGetComPorts,
  emitGetCurrentMissionAll,
  emitGetHomePosition,
  emitGetLoiterRadius,
  emitIsConnectedToDrone,
  emitLand,
  emitReposition,
  emitSetCurrentFlightMode,
  emitSetLoiterRadius,
  emitSetState,
  emitTakeoff,
  setState,
} from "../slices/droneConnectionSlice"
import {
  emitControlMission,
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
        store.dispatch(setState(action.payload))
        socket.socket.emit("set_state", action.payload)
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
      emitter: emitSetLoiterRadius,
      callback: () =>
        socket.socket.emit("set_loiter_radius", {
          radius: action.payload,
        }),
    },
    {
      emitter: emitGetLoiterRadius,
      callback: () => socket.socket.emit("get_loiter_radius"),
    },
    {
      emitter: emitReposition,
      callback: () =>
        socket.socket.emit("reposition", {
          lat: action.payload.lat,
          lon: action.payload.lon,
          alt: action.payload.alt,
        }),
    },
    {
      emitter: emitArmDisarm,
      callback: () =>
        socket.socket.emit("arm_disarm", {
          arm: action.payload.arm,
          force: action.payload.force,
        }),
    },
    {
      emitter: emitTakeoff,
      callback: () =>
        socket.socket.emit("takeoff", { alt: action.payload.alt }),
    },
    {
      emitter: emitLand,
      callback: () => socket.socket.emit("land"),
    },
    {
      emitter: emitSetCurrentFlightMode,
      callback: () =>
        socket.socket.emit("set_current_flight_mode", {
          newFlightMode: action.payload.newFlightMode,
        }),
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
    {
      emitter: emitControlMission,
      callback: () => {
        const controlAction = action.payload.action
        if (!["start", "restart"].includes(controlAction))
          return console.error(
            `Invalid control mission action, got ${controlAction}`,
          )

        socket.socket.emit("control_mission", {
          action: controlAction,
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
