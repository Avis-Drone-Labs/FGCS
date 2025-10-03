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

    response = droneStatus.drone.paramsController.setMultipleParams(params_list)
    if response.get("success"):
        socketio.emit("param_set_success", response)
    else:
        socketio.emit("params_error", response)


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

    timeout_secs = 120

    timeout = time.time() + timeout_secs
    last_index_sent = -1

    while droneStatus.drone and droneStatus.drone.paramsController.is_requesting_params:
        if time.time() > timeout:
            socketio.emit(
                "params_error",
                {
                    "message": f"Parameter request timed out after {timeout_secs} seconds."
                },
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
                    "current_param_id": droneStatus.drone.paramsController.current_param_id,
                    "total_number_of_params": droneStatus.drone.paramsController.total_number_of_params,
                },
            )
            last_index_sent = droneStatus.drone.paramsController.current_param_index

        time.sleep(0.2)

    socketio.emit("params", droneStatus.drone.paramsController.params)
