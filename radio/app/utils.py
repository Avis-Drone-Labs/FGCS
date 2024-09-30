import sys
from typing import Any, List

from pymavlink import mavutil
from serial.tools import list_ports

from . import socketio, logger

import socket


def getComPort() -> str:
    """
    Get a com port name from a selected list. This is only used in testing as its CLI interface and is NOT used in the GUI.

    Returns:
        The port name that was selected
    """
    while True:
        ports = list(list_ports.comports())

        print("Available COM ports:")
        for i in range(len(ports)):
            port = ports[i]
            print(f"\t[{i}]\t{port.name}: {port.description}")

        inp_port = input("Enter a port index to connect to: ")
        if not inp_port.isdigit():
            continue

        inp_port_num = int(inp_port)
        if 0 <= inp_port_num < len(ports):
            break

    if sys.platform == "darwin":
        port_name = ports[inp_port_num].name
        if port_name[:3] == "cu.":
            port_name = port_name[3:]

        port_name = f"/dev/tty.{port_name}"
    elif sys.platform in ["linux", "linux2"]:
        port_name = f"/dev/{ports[inp_port_num].name}"
    else:
        port_name = ports[inp_port_num].name

    return port_name


def getComPortNames() -> List[str]:
    """
    Gets a list of all available COM port names

    Returns:
        The names of COM ports available
    """
    ports = list(list_ports.comports())
    correct_ports = []
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

        correct_ports.append(port_name)

    return correct_ports


def secondsToMicroseconds(secs: float) -> int:
    """
    Converts seconds to microseconds

    Args:
        secs: The number in seconds

    Returns:
        The input "secs" in microseconds, as an integer
    """
    return int(secs * 1e6)


def commandAccepted(response: Any, command: int) -> bool:
    """
    Check if a command has been accepted

    Args:
        response: The response from the command
        command: The command inputted

    Returns:
        True if the command has been accepted, False otherwise.
    """
    return bool(
        response
        and command
        and response.command == command
        and response.result == mavutil.mavlink.MAV_RESULT_ACCEPTED
    )


def normalisePwmValue(val: float, min_val: float = 1000, max_val: float = 2000) -> int:
    """
    Normalise a PWM value to the range -1 to 1

    Args:
        val: The value to normalise
        min_val: Minimum pwm value accepted by the servo
        max_val: Maximum pwm value accepted by the servo

    Returns:
        The normalised PWM value
    """
    return int(2 * ((val - min_val) / (max_val - min_val)) - 1)


def droneErrorCb(msg: Any) -> None:
    """
    Send drone error to the socket

    Args:
        msg: The error message to send to the client
    """
    socketio.emit("drone_error", {"message": msg})


def droneConnectStatusCb(msg: Any) -> None:
    """
    Send drone connect status updates to the socket

    Args:
        msg: The connect message to send to the client
    """
    socketio.emit("drone_connect_status", {"message": msg})

def notConnectedError(action: str | None = None) -> None:
    """
    Send error to the socket indicating that drone connection must be established to complete this action

    Args:
        action (str | None): The action the that requires drone connection. Default `None`.
    """
    socketio.emit(
        "connection_error",
        {
            "message": f"Must be connected to the drone to {'perform this action' if action is None else action}."
        },
    )


def missingParameterError(endpoint: str, params: str | list[str]) -> None:
    """ "
    Send error to the socket indicating that a request made to the server was missing required parameters

    Args
        endpoint (str): The endpoint that is missing a parameter
        params (str | list[str]): The names of the parameter/s that are missing from the request
    """
    socketio.emit(
        "drone_error",
        {
            "message": f"Request to endpoint {endpoint} missing value for parameter"
            + (f": {params}" if isinstance(params, str) else ", ".join(params))
            + "."
        },
    )

def sendMessage(msg: Any) -> None:
    """
    Sends a message to the frontend with a timestamp

    Args:
        msg: The message to send
    """
    data = msg.to_dict()
    data["timestamp"] = msg._timestamp
    socketio.emit("incoming_msg", data)

def checkNetworkPort(connect_string: str):
    """
        Checks if the provided network port is open
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # TCP
        #sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP
        socket.setdefaulttimeout(2.0) # seconds (float)
        result = sock.connect_ex(connect_string)
        if result == 0:
            # print ("Port is open")
            sock.close()
            return "LISTENING"
        else:
            # print ("Port is closed/filtered")
            sock.close()
            return "CLOSED"
    except:
        sock.close()
        logger.error("Operation failed. Cannot connect to closed socket.")
        