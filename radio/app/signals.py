from blinker import Signal
from . import socketio

drone_error = Signal()


@drone_error.connect
def drone_error_handler(msg: str):
    socketio.emit("drone_error", {"message": msg})

    ## Optionally you can add return values
    ## That would be what the function would return to the caller
    # return "Received"
