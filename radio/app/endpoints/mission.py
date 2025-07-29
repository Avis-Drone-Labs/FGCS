from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError


class CurrentMissionType(TypedDict):
    type: str


class WriteCurrentMissionType(TypedDict):
    type: str
    items: list[dict]


class ControlMissionType(TypedDict):
    action: str


@socketio.on("get_current_mission")
def getCurrentMission(data: CurrentMissionType) -> None:
    """
    Sends the current mission to the frontend, only works if dashboard or missions screen is loaded.
    """
    if droneStatus.state not in ["dashboard", "missions"]:
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the dashboard or missions screen to get the current mission."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get current mission")

    mission_type = data.get("type")
    mission_type_array = ["mission", "fence", "rally"]

    if mission_type not in mission_type_array:
        socketio.emit(
            "current_mission",
            {
                "success": False,
                "message": f"Invalid mission type. Must be 'mission', 'fence', or 'rally', got {mission_type}.",
            },
        )
        logger.error(f"Could not get mission items for {mission_type} type.")
        return

    result = droneStatus.drone.missionController.getCurrentMission(
        mission_type_array.index(mission_type)
    )

    if not result.get("success"):
        logger.error(result.get("message"))
        socketio.emit("current_mission", result)
        return

    socketio.emit(
        "current_mission",
        {"success": True, "mission_type": mission_type, "items": result.get("data")},
    )


@socketio.on("get_current_mission_all")
def getCurrentMissionAll() -> None:
    """
    Sends the current mission to the frontend, only works if dashboard or missions screen is loaded.
    """
    if droneStatus.state not in ["dashboard", "missions"]:
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the dashboard or missions screen to get the current mission."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get current mission")

    result = droneStatus.drone.missionController.getCurrentMissionAll()

    socketio.emit(
        "current_mission_all",
        {
            "mission_items": result.get("data", {}).get("mission_items", []),
            "fence_items": result.get("data", {}).get("fence_items", []),
            "rally_items": result.get("data", {}).get("rally_items", []),
        },
    )


@socketio.on("write_current_mission")
def writeCurrentMission(data: WriteCurrentMissionType) -> None:
    """
    Writes the current mission to the drone, only works if missions screen is loaded.
    """
    if droneStatus.state != "missions":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the missions screen to write the current mission."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="write current mission")

    mission_type = data.get("type")
    mission_type_array = ["mission", "fence", "rally"]

    if mission_type not in mission_type_array:
        socketio.emit(
            "current_mission",
            {
                "success": False,
                "message": f"Invalid mission type. Must be 'mission', 'fence', or 'rally', got {mission_type}.",
            },
        )
        logger.error(f"Could not get mission items for {mission_type} type.")
        return

    items = data.get("items", [])

    result = droneStatus.drone.missionController.uploadMission(
        mission_type_array.index(mission_type), items
    )
    if not result.get("success"):
        logger.error(result.get("message"))

    socketio.emit("write_mission_result", result)


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
