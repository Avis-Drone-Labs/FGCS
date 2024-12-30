import time
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

    timeout = time.time() + 20 # 20 seconds from now yipee
    last_index_sent = -1

    while droneStatus.drone and droneStatus.drone.paramsController.is_requesting_params:
        if time.time() > timeout:
            socketio.emit(
                "params_error",
                {"message": "Parameter request timed out after 3 minutes."},
            )
            return

        if (
            last_index_sent != droneStatus.drone.paramsController.current_param_index
            and droneStatus.drone.paramsController.current_param_index > last_index_sent
        ):
            socketio.emit(
                "param_request_update",
                {
                    "current_param_index": droneStatus.drone.paramsController.current_param_index,
                    "total_number_of_params": droneStatus.drone.paramsController.total_number_of_params,
                },
            )
            last_index_sent = droneStatus.drone.paramsController.current_param_index

        time.sleep(0.2)

    if droneStatus.drone:
        socketio.emit("params", droneStatus.drone.paramsController.params)
