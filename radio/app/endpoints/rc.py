import app.droneStatus as droneStatus
from app import fgcs_logger, socketio
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
        fgcs_logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get the RC config")

    rc_params = droneStatus.drone.rcController.params
    rc_params[
        "flight_modes"
    ] = droneStatus.drone.flightModesController.flight_mode_channel

    socketio.emit(
        "rc_config",
        droneStatus.drone.rcController.params,
    )
