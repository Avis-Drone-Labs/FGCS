import time

import serial

import app.droneStatus as droneStatus
from app import logger, socketio
from app.drone import Drone
from app.utils import getComPortNames


@socketio.on("reboot_autopilot")
def rebootAutopilot() -> None:
    """
    Attempt to reboot the autopilot, this will try to reconnect to the drone 3 times before stopping. This will also stop if the port
    is not open for 5 seconds.
    """
    if not droneStatus.drone:
        return

    port = droneStatus.drone.port
    baud = droneStatus.drone.baud
    wireless = droneStatus.drone.wireless
    droneErrorCb = droneStatus.drone.droneErrorCb
    droneDisconnectCb = droneStatus.drone.droneDisconnectCb
    socketio.emit("disconnected_from_drone")
    droneStatus.drone.rebootAutopilot()

    while droneStatus.drone.is_active:
        time.sleep(0.05)

    counter = 0
    while counter < 10:
        if port in getComPortNames():
            break
        counter += 1
        time.sleep(0.5)
    else:
        logger.debug("Port not open after 5 seconds.")
        socketio.emit(
            "reboot_autopilot",
            {"success": False, "message": "Port not open after 5 seconds."},
        )
        return

    tries = 0
    while tries < 3:
        try:
            droneStatus.drone = Drone(
                port,
                baud=baud,
                wireless=wireless,
                droneErrorCb=droneErrorCb,
                droneDisconnectCb=droneDisconnectCb,
            )
            break
        except serial.serialutil.SerialException:
            tries += 1
            time.sleep(1)
    else:
        logger.debug("Could not reconnect to drone after 3 attempts.")
        socketio.emit(
            "reboot_autopilot",
            {
                "success": False,
                "message": "Could not reconnect to drone after 3 attempts.",
            },
        )
        return

    time.sleep(1)
    socketio.emit("connected_to_drone")
    logger.debug("Rebooted autopilot successfully.")
    socketio.emit(
        "reboot_autopilot",
        {"success": True, "message": "Rebooted autopilot successfully."},
    )
