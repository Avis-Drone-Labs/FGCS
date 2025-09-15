import app.droneStatus as droneStatus
from app import fgcs_logger, socketio
from app.utils import droneErrorCb


@socketio.on("gripper_enabled")
def gripperEnabled() -> None:
    """
    Tells the frontend whether or not the gripper is enabled, this only works on the config page.
    """
    if droneStatus.state != "config":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the gripper."},
        )
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        droneErrorCb("You must be connected to the drone to access the gripper.")
        fgcs_logger.warning("Attempted to get gripper state when drone is None.")
        return
    enabled = droneStatus.drone.gripperController.getEnabled()
    droneErrorCb(
        "Could not get gripper state from drone."
    ) if enabled is None else socketio.emit("gripper_enabled", enabled)


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
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        droneErrorCb("You must be connected to the drone to access the gripper.")
        fgcs_logger.warning("Attempted to set gripper value when drone is None.")
        return

    if action not in ["release", "grab"]:
        droneErrorCb('Gripper action must be either "release" or "grab"')
        return

    result = droneStatus.drone.gripperController.setGripper(action)
    socketio.emit("set_gripper_result", result)
