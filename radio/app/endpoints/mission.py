from typing import List
from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import fgcs_logger, socketio
from app.utils import notConnectedError


class CurrentMissionType(TypedDict):
    type: str


class ControlMissionType(TypedDict):
    action: str


class UploadMissionType(TypedDict):
    type: str
    mission_data: List[dict]


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
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
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
        fgcs_logger.error(f"Could not get mission items for {mission_type} type.")
        return

    result = droneStatus.drone.missionController.getCurrentMission(
        mission_type_array.index(mission_type)
    )

    if not result.get("success"):
        fgcs_logger.error(result.get("message"))
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
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
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


@socketio.on("control_mission")
def controlMission(data: ControlMissionType) -> None:
    """
    Controls the current mission based on the action, only works if dashboard or missions screen is loaded.
    """
    if droneStatus.state not in ["dashboard", "missions"]:
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the dashboard or missions screen to control a mission."
            },
        )
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="control mission")

    action = data.get("action", None)

    fgcs_logger.info(f"Received mission control action: {action}")

    if action not in ["start", "restart", "pause", "resume"]:
        socketio.emit(
            "params_error",
            {"message": f"Invalid action for controlling the mission, got {action}."},
        )
        fgcs_logger.debug(f"Invalid action for controlling the mission: {action}")
        return

    if action == "start":
        result = droneStatus.drone.missionController.startMission()
    elif action == "restart":
        result = droneStatus.drone.missionController.restartMission()
    elif action == "pause":
        fgcs_logger.info("Pausing mission...")
        result = droneStatus.drone.missionController.pauseMission()
        fgcs_logger.info(f"Pause result: {result}")
    elif action == "resume":
        fgcs_logger.info("Resuming mission...")
        result = droneStatus.drone.missionController.resumeMission()
        fgcs_logger.info(f"Resume result: {result}")

    socketio.emit("mission_control_result", result)


@socketio.on("upload_mission")
def uploadMission(data: UploadMissionType) -> None:
    """
    Uploads mission data to the drone, only works if missions screen is loaded.
    """
    if droneStatus.state != "missions":
        socketio.emit(
            "params_error",
            {"message": "You must be on the missions screen to upload a mission."},
        )
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="upload mission")

    mission_type = data.get("type")
    mission_data = data.get("mission_data", [])
    mission_type_array = ["mission", "fence", "rally"]

    if mission_type not in mission_type_array:
        socketio.emit(
            "upload_mission_result",
            {
                "success": False,
                "message": f"Invalid mission type. Must be 'mission', 'fence', or 'rally', got {mission_type}.",
            },
        )
        fgcs_logger.error(f"Invalid mission type for upload: {mission_type}")
        return

    fgcs_logger.info(f"Uploading {mission_type} mission with {len(mission_data)} items")
    fgcs_logger.debug(f"Mission data: {mission_data}")

    result = droneStatus.drone.missionController.uploadMissionData(
        mission_data, mission_type_array.index(mission_type)
    )

    fgcs_logger.info(f"Upload result: {result}")
    socketio.emit("upload_mission_result", result)
