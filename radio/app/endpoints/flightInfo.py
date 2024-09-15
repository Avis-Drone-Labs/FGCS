import app.droneStatus as droneStatus
from app import logger, socketio


@socketio.on("get_flight_info")
def getFlightInfo() -> None:
    """
    Sends flight information to the frontend - like bootup-time, arm-time and takeoff-time.
    Only works when dashboard is loaded
    """
    if droneStatus.state != "dashboard":
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    result = droneStatus.drone.flightInfoController.getFlightInfo()
    socketio.emit("get_flight_info_result", result)
