import logging
import os
import sys
from datetime import datetime

from flask import Flask
from flask_socketio import SocketIO


def create_directory(path: str, count: int) -> str:
    """
    Recursively calls itself until it reaches a un-used directory name

    Args:
        - path: a string value of the folder name
        - count: the number of calls of the recursion
    Returns:
        a string with the un-used directory name

    """
    try:
        subdir_name = path
        if count != 0:
            subdir_name = f"{path}-{count}"
            os.makedirs(subdir_name)
        else:
            os.makedirs(path)
        return subdir_name
    except OSError:
        return create_directory(path, count + 1)


log_dir = os.path.expanduser("~/.imacs/logs")

# Checks if a Configuration Directory exists
if "IMACS_LOG_DIR" in os.environ:
    log_dir = os.environ["IMACS_LOG_DIR"]

timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

os.makedirs(log_dir, exist_ok=True)

log_sub_dir = create_directory(f"{log_dir}/{timestamp}", 0)

formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

stream_handler = logging.StreamHandler(sys.stdout)  # logs to stdout
stream_handler.setFormatter(formatter)
stream_handler.setLevel(logging.DEBUG)

# Root Logs
root_file = logging.FileHandler(f"{log_sub_dir}/root.log")
root_logger = logging.getLogger()
root_logger.addHandler(root_file)
root_logger.addHandler(stream_handler)

# FGCS Logs
fgcs_file = logging.FileHandler(f"{log_sub_dir}/fgcs.log")
fgcs_logger = logging.getLogger("fgcs")
fgcs_logger.setLevel(logging.DEBUG)
fgcs_logger.addHandler(fgcs_file)
fgcs_logger.addHandler(stream_handler)

# Flask Logs
flask_file = logging.FileHandler(f"{log_sub_dir}/flask.log")
flask_logger = logging.getLogger("werkzeug")
flask_logger.setLevel(logging.INFO)
flask_logger.addHandler(flask_file)
flask_logger.addHandler(stream_handler)

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def create_app(debug: bool = False) -> Flask:
    """
    Creates the flask/socketio application.

    Args:
        debug: Boolean value for if the debugging should be True or False
    """
    from app.endpoints import endpoints

    app = Flask(__name__)
    app.debug = debug
    app.config["SECRET_KEY"] = "secret-key"

    app.register_blueprint(endpoints)

    fgcs_logger.info("Initialising app")
    socketio.init_app(app)
    return app
