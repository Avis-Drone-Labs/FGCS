import time

import app.droneStatus as droneStatus
from app import logger, socketio
from app.drone import Drone


@socketio.on("reboot_autopilot")
def rebootAutopilot() -> None:
    """
    Attempt to reboot the autopilot, this will try to reconnect to the drone 3 times before stopping.

    Note: If SITL is running and you are connected via TCP 5763 then rebooting does not work as expected.
    Use TCP 5760 instead.
    """
    if not droneStatus.drone:
        return

    port = droneStatus.drone.port
    baud = droneStatus.drone.baud
    wireless = droneStatus.drone.wireless
    droneErrorCb = droneStatus.drone.droneErrorCb
    droneDisconnectCb = droneStatus.drone.droneDisconnectCb
    droneConnectStatusCb = droneStatus.drone.droneConnectStatusCb
    linkDebugStatsCb = droneStatus.drone.linkDebugStatsCb

    socketio.emit("disconnected_from_drone")

    droneStatus.drone.rebootAutopilot()

    while droneStatus.drone.is_active.is_set():
        print("Waiting for drone to disconnect...")
        time.sleep(0.05)

    droneStatus.drone = None

    time.sleep(1.5)  # Wait for the port to be released and let the autopilot reboot

    tries = 0
    while tries < 3:
        droneStatus.drone = Drone(
            port,
            baud=baud,
            wireless=wireless,
            droneErrorCb=droneErrorCb,
            droneDisconnectCb=droneDisconnectCb,
            droneConnectStatusCb=droneConnectStatusCb,
            linkDebugStatsCb=linkDebugStatsCb,
        )
        if droneStatus.drone.connectionError:
            tries += 1
            time.sleep(2)
        else:
            break
    else:
        droneStatus.drone = None
        logger.error("Could not reconnect to drone after 3 attempts.")
        socketio.emit(
            "reboot_autopilot",
            {
                "success": False,
                "message": "Could not reconnect to drone after 3 attempts.",
            },
        )
        return

    time.sleep(1)
    socketio.emit(
        "connected_to_drone", {"aircraft_type": droneStatus.drone.aircraft_type}
    )
    logger.info("Rebooted autopilot successfully.")
    socketio.emit(
        "reboot_autopilot",
        {"success": True, "message": "Rebooted autopilot successfully."},
    )
