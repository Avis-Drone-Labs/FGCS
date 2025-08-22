import logging

from flask import Flask
from flask_socketio import SocketIO

from loggingConfig import setup_logging

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

logger = logging.getLogger("fgcs")

def create_app(debug: bool = False) -> Flask:
    """
    Creates the flask/socketio application.

    Args:
        debug: Boolean value for if the debugging should be True or False
    """
    
    setup_logging(socketio, debug)
    
    from app.endpoints import endpoints

    app = Flask(__name__)
    app.debug = debug
    app.config["SECRET_KEY"] = "secret-key"

    app.register_blueprint(endpoints)

    logger.info("Initialising app")
    socketio.init_app(app)
    return app
