import sys
import time
import logging

from flask_socketio import SocketIO


class SocketIOHandler(logging.Handler):
    
    def __init__(self, sio: SocketIO) -> None:
        super().__init__()
        self.socket = sio
    
    def emit(self, record) -> None:
        
        try:
            entry = self.format(record)
            self.socket.emit("log", {"level": record.levelname, "message": entry, "timestamp": time.time()})
        except:
            self.handleError(record)


def setup_logging(conn: SocketIO, debug: bool = False) -> logging.Logger:
    
    fgcs_logger = logging.getLogger("fgcs")
    
    fgcs_logger.setLevel(logging.DEBUG if debug else logging.INFO)
    fgcs_logger.addHandler(SocketIOHandler(conn))
    
    # Stream handler on debug mode only
    
    flask_logger = logging.getLogger("werkzeug")
    flask_logger.setLevel(logging.WARNING)
    flask_logger.addHandler(SocketIOHandler(conn))