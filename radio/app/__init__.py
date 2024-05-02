from flask import Flask
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*")


def create_app(debug=False) -> None:
    """
    Creates the flask application.
    
    Args:
        debug: Boolean value for if the debugging should be True or False
    """
    app = Flask(__name__)
    app.debug = debug
    app.config["SECRET_KEY"] = "secret-key"

    from .endpoints import main as main_blueprint

    app.register_blueprint(main_blueprint)

    socketio.init_app(app)
    return app
