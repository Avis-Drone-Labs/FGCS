from pymavlink import mavutil
from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError

# Filter out specific mission items, e.g. takeoff command
filter_mission_commands_list = [
    mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH,
    mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
    mavutil.mavlink.MAV_CMD_NAV_LAND_LOCAL,
    mavutil.mavlink.MAV_CMD_NAV_TAKEOFF_LOCAL,
    mavutil.mavlink.MAV_CMD_NAV_TAKEOFF_LOCAL,
    mavutil.mavlink.MAV_CMD_NAV_ALTITUDE_WAIT,
    mavutil.mavlink.MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT,
    mavutil.mavlink.MAV_CMD_NAV_DELAY,
    mavutil.mavlink.MAV_CMD_CONDITION_DISTANCE,
    mavutil.mavlink.MAV_CMD_DO_AUX_FUNCTION,
    mavutil.mavlink.MAV_CMD_DO_CHANGE_SPEED,
    mavutil.mavlink.MAV_CMD_DO_ENGINE_CONTROL,
    mavutil.mavlink.MAV_CMD_DO_VTOL_TRANSITION,
    mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
    mavutil.mavlink.MAV_CMD_DO_SET_RELAY,
    mavutil.mavlink.MAV_CMD_DO_REPEAT_SERVO,
    mavutil.mavlink.MAV_CMD_DO_REPEAT_RELAY,
    mavutil.mavlink.MAV_CMD_DO_DIGICAM_CONFIGURE,
    mavutil.mavlink.MAV_CMD_DO_DIGICAM_CONTROL,
    mavutil.mavlink.MAV_CMD_DO_SET_CAM_TRIGG_DIST,
    mavutil.mavlink.MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW,
    mavutil.mavlink.MAV_CMD_DO_JUMP,
    mavutil.mavlink.MAV_CMD_JUMP_TAG,
    mavutil.mavlink.MAV_CMD_DO_JUMP_TAG,
    mavutil.mavlink.MAV_CMD_DO_MOUNT_CONTROL,
    mavutil.mavlink.MAV_CMD_DO_INVERTED_FLIGHT,
    mavutil.mavlink.MAV_CMD_DO_FENCE_ENABLE,
    mavutil.mavlink.MAV_CMD_DO_AUTOTUNE_ENABLE,
    mavutil.mavlink.MAV_CMD_DO_SET_RESUME_REPEAT_DIST,
    mavutil.mavlink.MAV_CMD_STORAGE_FORMAT,
    mavutil.mavlink.MAV_CMD_NAV_GUIDED_ENABLE,
    mavutil.mavlink.MAV_CMD_MISSION_START,
    mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
    mavutil.mavlink.MAV_CMD_CONDITION_DELAY,
    mavutil.mavlink.MAV_CMD_CONDITION_DISTANCE,
    mavutil.mavlink.MAV_CMD_CONDITION_YAW,
    mavutil.mavlink.MAV_CMD_DO_AUX_FUNCTION,
    mavutil.mavlink.MAV_CMD_DO_CHANGE_SPEED,
    mavutil.mavlink.MAV_CMD_DO_PARACHUTE,
    mavutil.mavlink.MAV_CMD_DO_GRIPPER,
    mavutil.mavlink.MAV_CMD_DO_GUIDED_LIMITS,
    mavutil.mavlink.MAV_CMD_DO_SET_RESUME_REPEAT_DIST,
    mavutil.mavlink.MAV_CMD_DO_FENCE_ENABLE,
    mavutil.mavlink.MAV_CMD_DO_WINCH,
    mavutil.mavlink.MAV_CMD_DO_FOLLOW,
    mavutil.mavlink.MAV_CMD_DO_FOLLOW_REPOSITION,
    mavutil.mavlink.MAV_CMD_CONDITION_DELAY,
    mavutil.mavlink.MAV_CMD_CONDITION_YAW,
]


class ControlMissionType(TypedDict):
    action: str


@socketio.on("get_current_mission")
def getCurrentMission() -> None:
    """
    Sends the current mission to the frontend, only works if dashboard screen is loaded.
    """
    if droneStatus.state != "dashboard":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the dashboard screen to get the current mission."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get current mission")

    mission_items = [
        item.to_dict() for item in droneStatus.drone.missionController.mission_items
    ]
    fence_items = [
        item.to_dict() for item in droneStatus.drone.missionController.fence_items
    ]
    rally_items = [
        item.to_dict() for item in droneStatus.drone.missionController.rally_items
    ]

    mission_items_filtered = list(
        filter(
            lambda item: item.get("command") not in filter_mission_commands_list,
            mission_items,
        )
    )

    socketio.emit(
        "current_mission",
        {
            "mission_items": mission_items_filtered,
            "fence_items": fence_items,
            "rally_items": rally_items,
        },
    )


@socketio.on("control_mission")
def controlMission(data: ControlMissionType) -> None:
    """
    Controls the current mission based on the action, only works if dashboard screen is loaded.
    """
    if droneStatus.state != "dashboard":
        socketio.emit(
            "params_error",
            {"message": "You must be on the dashboard screen to control a mission."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="control mission")

    action = data.get("action", None)

    if action not in ["start", "restart"]:
        socketio.emit(
            "params_error",
            {"message": f"Invalid action for controlling the mission, got {action}."},
        )
        logger.debug(f"Invalid action for controlling the mission: {action}")
        return

    if action == "start":
        result = droneStatus.drone.missionController.startMission()
    elif action == "restart":
        result = droneStatus.drone.missionController.restartMission()

    socketio.emit("mission_control_result", result)
