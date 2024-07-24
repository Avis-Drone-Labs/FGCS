import app.droneStatus as droneStatus
from app import logger, socketio


@socketio.on("get_frame_config")
def getFrameDetails() -> None:
    """
    Sends the current frame class and frame type of the drone to the frontend. Only works when on the motor test panel of config page
    """

    if droneStatus.state != "config.motor_test":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the motor test section of the config page to access the frame details"
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    frame_type = droneStatus.drone.frameController.frame_type
    frame_class = droneStatus.drone.frameController.frame_class
    socketio.emit(
        "frame_type_config",
        {"frame_type": frame_type, "frame_class": frame_class},
    )
