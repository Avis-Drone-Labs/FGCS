import sys
import time
from typing import Optional

from serial.tools import list_ports
from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.drone import Drone
from app.utils import droneConnectStatusCb, droneErrorCb, getComPortNames


class ConnectionDataType(TypedDict):
    port: str
    baud: int
    wireless: bool
    connectionType: str
    forwarding_address: Optional[str]


class LinkStatsType(TypedDict):
    total_packets_sent: int
    total_bytes_sent: int
    total_packets_received: int
    total_bytes_received: int
    total_receive_errors: int
    uptime: float
    avg_packets_sent_per_sec: float
    avg_bytes_sent_per_sec: float
    avg_packets_received_per_sec: float
    avg_bytes_received_per_sec: float


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


def sendLinkDebugStats(link_stats: LinkStatsType) -> None:
    """
    A callback function to send link debug stats
    """
    socketio.emit("link_debug_stats", link_stats)


@socketio.on("connect_to_drone")
def connectToDrone(data: ConnectionDataType) -> None:
    """
    This method is responsible for creating the initialising the drone object by
    connecting to it with the data given.

    Args:
        data: The message passed in from the client containing the form sent (select com port, baud rate, wireless)
    """
    if droneStatus.drone:
        droneStatus.drone.logger.warning(
            "Attempting a connection to drone when connection is already established."
        )
        droneStatus.drone.close()
        droneStatus.drone = None

    connectionType = data.get("connectionType")

    if connectionType not in ["serial", "network"]:
        socketio.emit("connection_error", {"message": "Connection type not specified."})
        return

    if connectionType == "serial":
        port = data.get("port")
        if not port:
            socketio.emit("connection_error", {"message": "COM port not specified."})
            return

        port = port.split(":")[0]
        if port not in getComPortNames():
            socketio.emit("connection_error", {"message": "COM port not found."})
            return
    else:
        port = data.get("port")  # networktype:ip:port
        if not port:
            socketio.emit(
                "connection_error", {"message": "Connection address not specified."}
            )
            return

    logger.debug("Trying to connect to drone")
    baud = data.get("baud", 57600)

    if not isinstance(baud, int):
        socketio.emit(
            "connection_error",
            {
                "message": f"Expected integer value for baud, received {type(baud).__name__}."
            },
        )
        droneStatus.drone = None
        return

    forwarding_address = data.get("forwardingAddress", None)
    if forwarding_address is not None and not isinstance(forwarding_address, str):
        socketio.emit(
            "connection_error",
            {
                "message": f"Expected string value for forwarding address, received {type(forwarding_address).__name__}."
            },
        )
        droneStatus.drone = None
        return

    drone = Drone(
        port,
        wireless=data.get("wireless", True),
        baud=baud,
        forwarding_address=forwarding_address,
        droneErrorCb=droneErrorCb,
        droneDisconnectCb=disconnectFromDrone,
        droneConnectStatusCb=droneConnectStatusCb,
        linkDebugStatsCb=sendLinkDebugStats,
    )

    if drone.connectionError is not None:
        socketio.emit("connection_error", {"message": drone.connectionError})
        droneStatus.drone = None
        return

    # Set droneStatus drone to local drone
    droneStatus.drone = drone

    # Sleeping for buffer time, if errors occur try changing back to 1 second
    time.sleep(0.2)
    logger.debug("Created drone instance")
    socketio.emit("connected_to_drone", {"aircraft_type": drone.aircraft_type})


@socketio.on("disconnect_from_drone")
def disconnectFromDrone() -> None:
    """
    Disconnect from drone and reset all global variables, send a message to client disconnecting as well
    """
    if droneStatus.drone:
        droneStatus.drone.close()
        droneStatus.drone = None

    droneStatus.state = None
    socketio.emit("disconnected_from_drone")
