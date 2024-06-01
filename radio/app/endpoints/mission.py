import app.droneStatus as droneStatus
from app import logger, socketio


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
        return

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
