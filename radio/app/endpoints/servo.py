import app.droneStatus as droneStatus
from app import logger, socketio
from app.customTypes import BatchSetConfigParams, SetConfigParam
from app.utils import notConnectedError

@socketio.on("get_servo_config")
def getServoConfig() -> None:
    """
    Sends the servo config to the frontend, only works when the config page is loaded.
    """
    if droneStatus.state != "config.servo":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the servo config screen to access the servo config."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get the servo config")

    servo_config = droneStatus.drone.servoController.getConfig()

    socketio.emit(
        "servo_config",
        servo_config,
    )


@socketio.on("set_servo_config_param")
def setServoConfigParam(data: SetConfigParam) -> None:
    """
    Sets a servo config parameter on the drone.
    """
    if droneStatus.state != "config.servo":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the servo config screen to set servo config parameters."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set a servo config parameter")

    param_id = data.get("param_id", None)
    value = data.get("value", None)

    if param_id is None or value is None:
        socketio.emit(
            "params_error",
            {"message": "Param ID and value must be specified."},
        )
        return

    success = droneStatus.drone.servoController.setConfigParam(param_id, value)
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
    socketio.emit("set_servo_config_result", result)


@socketio.on("batch_set_servo_config_params")
def batchSetServoConfigParams(data: BatchSetConfigParams) -> None:
    """
    Sets multiple servo config parameters on the drone.
    """
    if droneStatus.state != "config.servo":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the servo config screen to set servo config parameters."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set multiple servo config parameters")

    params = data.get("params", [])
    if not params:
        socketio.emit(
            "batch_set_servo_config_result",
            {"success": True, "message": "No parameters specified."},
        )
        return

    result = droneStatus.drone.servoController.batchSetConfigParams(params)

    socketio.emit("batch_set_servo_config_result", result)
