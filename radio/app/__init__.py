import logging

from flask import Flask
from flask_socketio import SocketIO

logging.basicConfig(level=logging.DEBUG)

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
    from app.endpoints.telemetry_namespace import TelemetryNamespace

    app = Flask(__name__)
    app.debug = debug
    app.config["SECRET_KEY"] = "secret-key"

    app.register_blueprint(endpoints)

    logger.info("Initialising app")
    socketio.init_app(app)

    # Register telemetry namespace
    socketio.on_namespace(TelemetryNamespace("/telemetry"))

    return app
