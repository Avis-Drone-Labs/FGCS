import logging
import time
import sys

from pathlib import Path
from flask import Flask
from flask_socketio import SocketIO

log_path = Path.home().joinpath("FGCS", "logs")
log_start_time = time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime())
logging.basicConfig(
    level=logging.DEBUG, filename=f"{log_path}\\FGCS_API_{log_start_time}.txt"
)

logger = logging.getLogger("fgcs")
logger.setLevel(logging.DEBUG)

flask_logger = logging.getLogger("werkzeug")
flask_logger.setLevel(logging.INFO)

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

    logger.info("Initialising app")
    socketio.init_app(app)

    return app
