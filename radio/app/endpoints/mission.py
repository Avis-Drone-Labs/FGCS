import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError


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

    # Filter out specific mission items, e.g. takeoff command
    mission_items_filtered = list(
        filter(lambda item: item.get("command") != 22, mission_items)
    )

    socketio.emit(
        "current_mission",
        {
            "mission_items": mission_items_filtered,
            "fence_items": fence_items,
            "rally_items": rally_items,
        },
    )
