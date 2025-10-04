import app.droneStatus as droneStatus
from app import logger, socketio
from app.customTypes import SetConfigParam
from app.utils import notConnectedError


@socketio.on("get_rc_config")
def getRcConfig() -> None:
    """
    Sends the RC config to the frontend, only works when the config page is loaded.
    """
    if droneStatus.state != "config.rc":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the RC config."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get the RC config")

    rc_params = droneStatus.drone.rcController.getConfig()
    rc_params[
        "flight_modes"
    ] = droneStatus.drone.flightModesController.flight_mode_channel

    socketio.emit(
        "rc_config",
        droneStatus.drone.rcController.params,
    )


@socketio.on("set_rc_config_param")
def setRcConfigParam(data: SetConfigParam) -> None:
    """
    Sets a RC config parameter on the drone.
    """
    if droneStatus.state != "config.rc":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the config screen to set RC config parameters."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set a RC config parameter")

    param_id = data.get("param_id")
    value = data.get("value")

    if param_id is None or value is None:
        socketio.emit(
            "params_error",
            {"message": "Param ID and value must be specified."},
        )
        return

    success = droneStatus.drone.rcController.setConfigParam(param_id, value)
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
    socketio.emit("set_rc_config_result", result)
