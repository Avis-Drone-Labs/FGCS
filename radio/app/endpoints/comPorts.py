import sys
import time

from serial.tools import list_ports

import app.droneStatus as droneStatus
from app import logger, socketio
from app.drone import Drone
from app.utils import droneErrorCb, getComPortNames


@socketio.on("get_com_ports")
def getComPort() -> None:
    """
    Gets a list of all COM port available and sends it to the client, also updates the global list of all ports
    """
    ports = list(list_ports.comports())
    droneStatus.correct_ports = []
    for i in range(len(ports)):
        port = ports[i]
        if sys.platform == "darwin":
            port_name = port.name
            if port_name[:3] == "cu.":
                port_name = port_name[3:]

            port_name = f"/dev/tty.{port_name}"
        elif sys.platform in ["linux", "linux2"]:
            port_name = f"/dev/{port.name}"
        else:
            port_name = port.name

        port_name = f"{port_name}: {port.description}"
        droneStatus.correct_ports.append(port_name)
    socketio.emit("list_com_ports", droneStatus.correct_ports)


@socketio.on("set_com_port")
def setComPort(data) -> None:
    """
    Set the com port of the drone and let the client know. This method is responsible for creating
    the initialising the drone object.

    Args:
        data: The message passed in from the client containing the form sent (select com port, baud rate, wireless)
    """
    if droneStatus.drone:
        droneStatus.drone.close()
        drone = None

    port = data.get("port")
    if not port:
        socketio.emit("com_port_error", {"message": "COM port not specified."})
        return

    port = port.split(":")[0]
    if port not in getComPortNames():
        socketio.emit("com_port_error", {"message": "COM port not found."})
        return

    logger.debug("Trying to connect to drone")
    baud = data.get("baud")
    drone: Drone = Drone(
        port,
        wireless=data.get("wireless", True),
        baud=baud,
        droneErrorCb=droneErrorCb,
        droneDisconnectCb=disconnectFromDrone,
    )

    if drone.connectionError is not None:
        socketio.emit("com_port_error", {"message": drone.connectionError})
        drone = None
        return

    # Set droneStatus drone to local drone
    droneStatus.drone = drone

    # Sleeping for buffer time, if errors occur try changing back to 1 second
    time.sleep(0.2)
    logger.debug("Created drone instance")
    socketio.emit("connected_to_drone")


@socketio.on("disconnect_from_drone")
def disconnectFromDrone() -> None:
    """
    Disconnect from drone and reset all global variables, send a message to client disconnecting as well
    """
    droneStatus.drone.close()
    droneStatus.drone = None
    droneStatus.state = None
    socketio.emit("disconnected_from_drone")
