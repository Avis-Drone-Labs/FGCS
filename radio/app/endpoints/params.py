from .. import socketio
import app.drone as droneStatus


@socketio.on("set_multiple_params")
def set_multiple_params(params_list):
    """
    Set multiple parameters at the same time.

    @param params_list: The list of parameters to be setting from the client.
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
