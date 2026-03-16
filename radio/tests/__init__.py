from app import create_app, socketio
from flask.testing import FlaskClient
from flask_socketio.test_client import SocketIOTestClient

app = create_app(debug=True)
socketio = socketio


@socketio.on("incoming_msg")
def ignore_incoming_msg(data):
    """Silently ignore telemetry incoming_msg events during testing"""
    pass


@socketio.on("link_debug_stats")
def ignore_link_debug_stats(data):
    """Silently ignore link_debug_stats events during testing"""
    pass


# Create flask/socketio clients to be used in tests
flask_client: FlaskClient = app.test_client()
socketio_client: SocketIOTestClient = socketio.test_client(
    app, flask_test_client=flask_client
)
