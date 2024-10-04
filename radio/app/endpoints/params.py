from typing import Any, List

import app.droneStatus as droneStatus
from app import logger, socketio

from app.utils import notConnectedError


@socketio.on("set_multiple_params")
def set_multiple_params(params_list: List[Any]) -> None:
    """
    Set multiple parameters at the same time.

    Args:
        params_list: The list of parameters to be setting from the client.
    """
    validStates = ["params", "config"]
    if droneStatus.state not in validStates:
        socketio.emit(
            "params_error",
            {"message": "You must be on the params screen to save parameters."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set parameter values")

    success = droneStatus.drone.paramsController.setMultipleParams(params_list)
    if success:
        socketio.emit(
            "param_set_success", {"message": "Parameters saved successfully."}
        )
    else:
        socketio.emit("params_error", {"message": "Failed to save parameters."})


@socketio.on("refresh_params")
def refresh_params() -> None:
    """
    Refresh all parameters
    """
    if droneStatus.state != "params":
        socketio.emit(
            "params_error",
            {"message": "You must be on the params screen to refresh the parameters."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError("get parameter values")

    droneStatus.drone.paramsController.getAllParams(
        timeoutCb=lambda t: socketio.emit(
            "params_error",
            {"message": f"Parameter request timed out after {t} seconds."},
        ),
        updateCb=lambda i, t: socketio.emit(
            "param_request_update",
            {"current_param_index": i, "total_number_of_params": t},
        ),
        completeCb=lambda params: socketio.emit("params", params),
    )
