from app import socketio, print
from app.utils import droneErrorCb
import app.droneStatus as droneStatus


@socketio.on("get_flight_mode_config")
def getFlightModeConfig() -> None:
    """
    Sends the flight mode config to the frontend, only works when the config page is loaded.
    """
    if droneStatus.state != "config.flight_modes":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the flight modes."},
        )
        print(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    flight_modes = droneStatus.drone.flight_modes.flight_modes
    flight_mode_channel = droneStatus.drone.flight_modes.flight_mode_channel

    socketio.emit(
        "flight_mode_config",
        {"flight_modes": flight_modes, "flight_mode_channel": flight_mode_channel},
    )


@socketio.on("set_flight_mode")
def setFlightMode(data) -> None:
    """
    Sets the flight mode based off data passed in, only works when the config page is loaded.
    """
    if droneStatus.state != "config.flight_modes":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the flight modes."},
        )
        print(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    mode_number = data.get("mode_number", None)
    flight_mode = data.get("flight_mode", None)

    if mode_number is None or flight_mode is None:
        droneErrorCb("Mode number and flight mode must be specified.")
        return

    result = droneStatus.drone.flight_modes.setFlightMode(mode_number, flight_mode)
    socketio.emit("set_flight_mode_result", result)


@socketio.on("refresh_flight_mode_data")
def refreshFlightModeData() -> None:
    """
    Refreshes the flight mode data, only works when the config page is loaded.
    """
    if droneStatus.state != "config.flight_modes":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the flight modes."},
        )
        print(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    droneStatus.drone.flight_modes.refreshData()

    flight_modes = droneStatus.drone.flight_modes.flight_modes
    flight_mode_channel = droneStatus.drone.flight_modes.flight_mode_channel

    socketio.emit(
        "flight_mode_config",
        {"flight_modes": flight_modes, "flight_mode_channel": flight_mode_channel},
    )
