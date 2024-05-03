import logging
from flask import Flask
from flask_socketio import SocketIO

logging.basicConfig(level=logging.DEBUG)
socketio = SocketIO(cors_allowed_origins="*")

# Default flush print so that they dont get hung with socketio.run()
def decorator(func):
    printer = func
    def wrapped(*args):
        printer(*args, flush=True)
    return wrapped

print = decorator(print)

def create_app(debug=False) -> None:
    """
    Creates the flask/socketio application.
    
    Args:
        debug: Boolean value for if the debugging should be True or False
    """
    from .endpoints import endpoints as endpoints_blueprint
    
    app = Flask(__name__)
    app.debug = debug
    app.config["SECRET_KEY"] = "secret-key"

    app.register_blueprint(endpoints_blueprint)

    print("Initialising app")
    socketio.init_app(app)
    return app
