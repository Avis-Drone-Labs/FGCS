import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import droneErrorCb


@socketio.on("get_gripper_enabled")
def getGripperEnabled() -> None:
    """
    Tells the frontend whether or not the gripper is enabled, this only works on the config page.
    """
    if droneStatus.state != "config":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the gripper."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        droneErrorCb("You must be connected to the drone to access the gripper.")
        logger.warning("Attempted to get gripper state when drone is None.")
        return

    enabled = droneStatus.drone.gripperController.getEnabled()
    socketio.emit("is_gripper_enabled", enabled)


@socketio.on("set_gripper")
def setGripper(action: str) -> None:
    """
    Sets the gripper value based off the input action, this only works on the config page.

    Args:
        action: The action the gripper should be set to, either 'release' or 'grab'.
    """
    if droneStatus.state != "config":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the gripper."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        droneErrorCb("You must be connected to the drone to access the gripper.")
        logger.warning("Attempted to set gripper value when drone is None.")
        return

    if action not in ["release", "grab"]:
        droneErrorCb('Gripper action must be either "release" or "grab"')
        return

    result = droneStatus.drone.gripperController.setGripper(action)
    socketio.emit("set_gripper_result", result)


@socketio.on("get_gripper_config")
def getGripperConfig() -> None:
    """
    Sends the gripper config to the frontend, only works when the config page is loaded.
    """
    if droneStatus.state != "config":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the config screen to access the gripper configuration."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        logger.warning("Attempted to get the gripper config when drone is None.")
        return droneErrorCb(action="get the gripper config")

    gripper_config = droneStatus.drone.gripperController.getConfig()

    socketio.emit(
        "gripper_config",
        {"params": gripper_config},
    )


@socketio.on("set_gripper_config_param")
def setGripperParam(data: dict) -> None:
    """
    Sets a gripper parameter based off data passed in, only works when the config page is loaded.
    """
    if droneStatus.state != "config":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the config screen to access the gripper configuration."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        logger.warning("Attempted to set a gripper param when drone is None.")
        return droneErrorCb(action="set a gripper param")

    param_id = data.get("param_id", None)
    value = data.get("value", None)

    if param_id is None or value is None:
        droneErrorCb("Param ID and value must be specified.")
        return

    success = droneStatus.drone.gripperController.setGripperParam(param_id, value)
    if success:
        result = {
            "success": True,
            "message": f"Parameter {param_id} successfully set to {value}.",
            "param_id": param_id,
            "value": value,
        }
    else:
        result = {
            "success": False,
            "message": f"Failed to set parameter {param_id} to {value}.",
        }
    socketio.emit("set_gripper_param_result", result)
