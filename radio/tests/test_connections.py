from . import falcon_test
from flask_socketio.test_client import SocketIOTestClient
from flask.testing import FlaskClient


@falcon_test
def test_connection(flask_client: FlaskClient, socketio_client: SocketIOTestClient):
    """
    Test arming function
    """
    flask_result = flask_client.post("/connect")
    assert flask_result.status_code == 404  # No result sent back so error 404

    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back

    
