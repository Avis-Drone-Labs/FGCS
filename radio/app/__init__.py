import logging
from typing import Any


from flask import Flask
from flask_socketio import SocketIO

logging.basicConfig(level=logging.DEBUG)

logger = logging.getLogger("fgcs")
logger.setLevel(logging.DEBUG)

flask_logger = logging.getLogger("werkzeug")
flask_logger.setLevel(logging.INFO)


socketio = SocketIO(cors_allowed_origins="*")


def create_app(debug: bool = False) -> Any:
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
