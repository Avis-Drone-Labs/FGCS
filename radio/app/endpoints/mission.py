from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError


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

    socketio.emit(
        "current_mission",
        {
            "mission_items": mission_items,
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
