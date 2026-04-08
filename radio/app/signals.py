from blinker import Signal
from . import socketio

from typing import TypedDict, NotRequired
from app.customTypes import Number

# Define signals
DroneError = Signal()
DroneConnectStatus = Signal()


@DroneError.connect
def droneErrorHandler(msg: str) -> None:
    """
    Send drone error to the socket

    Args:
        msg: The error message to send to the client
    """
    socketio.emit("drone_error", {"message": msg})

    ## Optionally you can add return values
    ## That would be what the function would return to the caller
    # return "Received"


class ConnectionDataType(TypedDict):
    message: str
    progress: Number
    sub_message: NotRequired[str]


@DroneConnectStatus.connect
def droneConnectStatusHandler(msg: ConnectionDataType) -> None:
    """
    Send drone connect status updates to the socket

    Args:
        msg: The connect message to send to the client
    """
    socketio.emit("drone_connect_status", msg)
