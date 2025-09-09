import os
import time
import socket
import logging

from flask_socketio import SocketIO


class SocketIOHandler(logging.Handler):
    def __init__(self, sio: SocketIO) -> None:
        super().__init__()
        self.socket = sio

    def emit(self, record) -> None:
        try:
            entry = self.format(record)
            self.socket.emit(
                "log",
                {
                    "level": record.levelname,
                    "message": entry,
                    "timestamp": time.time(),
                    "file": record.filename,
                    "line": record.lineno,
                },
            )
        except socket.error:
            self.handleError(record)


def setup_logging(conn: SocketIO, debug: bool = False) -> None:
    fgcs_logger = logging.getLogger("fgcs")

    fgcs_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    flask_logger = logging.getLogger("werkzeug")

    flask_logger.setLevel(logging.WARNING)

    # Our test suite is stupid and all of them just check the last received message instead of filtering
    # for the message they were expecting so we can't do socket logging in test environment

    if os.environ.get("PYTEST_VERSION") is None:
        fgcs_logger.addHandler(SocketIOHandler(conn))
        flask_logger.addHandler(SocketIOHandler(conn))
