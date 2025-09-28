from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.customTypes import SetFlightModeValueAndNumber
from app.utils import droneErrorCb, notConnectedError


class SetCurrentFlightModeType(TypedDict):
    newFlightMode: int


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
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="get the flight mode config")

    flight_modes_config = droneStatus.drone.flightModesController.getConfig()

    socketio.emit(
        "flight_mode_config",
        flight_modes_config,
    )


@socketio.on("set_flight_mode")
def setFlightMode(data: SetFlightModeValueAndNumber) -> None:
    """
    Sets the flight mode based off data passed in, only works when the config page is loaded.

    Args:
        data (SetFlightModeValueAndNumber): Contains the flight mode number and the flight mode to set to it
    """
    if droneStatus.state != "config.flight_modes":
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access the flight modes."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set the flight mode")

    mode_number = data.get("mode_number", None)
    flight_mode = data.get("flight_mode", None)

    if mode_number is None or flight_mode is None:
        droneErrorCb("Mode number and flight mode must be specified.")
        return

    result = droneStatus.drone.flightModesController.setFlightMode(
        mode_number, flight_mode
    )
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
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="refresh the flight mode data")

    droneStatus.drone.flightModesController.refreshData()

    flight_modes = droneStatus.drone.flightModesController.flight_modes
    flight_mode_channel = droneStatus.drone.flightModesController.flight_mode_channel

    socketio.emit(
        "flight_mode_config",
        {"flight_modes": flight_modes, "flight_mode_channel": flight_mode_channel},
    )


@socketio.on("set_current_flight_mode")
def setCurrentFlightMode(data: SetCurrentFlightModeType) -> None:
    """
    Sets the current flight mode of the drone, only works when the dashboard is loaded

    Args:
        data (dict): A dictionary containing the flight mode to be set as an integer
    """
    if droneStatus.state != "dashboard":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the dashboard screen to set the current flight mode."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="set the current flight mode")

    new_flight_mode = data.get("newFlightMode")

    if new_flight_mode is None:
        droneErrorCb("Flight mode must be specified.")
        return

    result = droneStatus.drone.flightModesController.setCurrentFlightMode(
        new_flight_mode
    )
    socketio.emit("set_current_flight_mode_result", result)
