from typing import Any, List

import app.droneStatus as droneStatus
from app import logger, socketio


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
        return

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
        return

    droneStatus.drone.paramsController.getAllParams()
    droneStatus.drone.paramsController.fetchAllParams(
        timeoutCb=lambda: socketio.emit(
            "params_error",
            {"message": "Parameter request timed out after 3 minutes."},
        ),
        updateCb=lambda i, t: socketio.emit(
            "param_request_update",
            {"current_param_index": i, "total_number_of_params": t},
        ),
    )

    if droneStatus.drone:
        socketio.emit("params", droneStatus.drone.paramsController.params)
