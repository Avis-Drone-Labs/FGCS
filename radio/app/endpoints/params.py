import time
from .. import socketio
from typing import List
import app.drone as droneStatus


@socketio.on("set_multiple_params")
def set_multiple_params(params_list: List[any]) -> None:
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
        print(f"Current state: {droneStatus.state}")
        return

    success = droneStatus.drone.setMultipleParams(params_list)
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
        print(f"Current state: {droneStatus.state}")
        return

    droneStatus.drone.getAllParams()

    timeout = time.time() + 60 * 3  # 3 minutes from now
    last_index_sent = -1

    while droneStatus.drone and droneStatus.drone.is_requesting_params:
        if time.time() > timeout:
            socketio.emit(
                "params_error",
                {"message": "Parameter request timed out after 3 minutes."},
            )
            return

        if (
            last_index_sent != droneStatus.current_param_index
            and droneStatus.drone.current_param_index > last_index_sent
        ):
            socketio.emit(
                "param_request_update",
                {
                    "current_param_index": droneStatus.drone.current_param_index,
                    "total_number_of_params": droneStatus.drone.total_number_of_params,
                },
            )
            last_index_sent = droneStatus.drone.current_param_index

        time.sleep(0.2)

    if droneStatus.drone:
        socketio.emit("params", droneStatus.drone.params)
