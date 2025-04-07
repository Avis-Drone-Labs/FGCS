from flask import Flask
from flask_socketio import SocketIO

from .logging_config import setup_logging


logger = setup_logging()
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
