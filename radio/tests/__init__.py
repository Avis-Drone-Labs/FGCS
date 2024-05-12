# The below is done so we cna import from ../app
import sys
sys.path.append("..")

from typing import Callable
from app import create_app, socketio
from flask_socketio.test_client import SocketIOTestClient
from flask.testing import FlaskClient

app = create_app(debug=True)
socketio = socketio


def falcon_test(test_func: Callable):
    """
    Useful wrapper for a test function on project falcon

    Args:
        test_func (callable): The function you want to test
    """

    def inner(*args, **kwargs):
        # Create flask/socketio client to be used in each test
        flask_client: FlaskClient = app.test_client()
        socketio_client: SocketIOTestClient = socketio.test_client(app, flask_test_client=flask_client)

        # Make sure the server did not rejected the connection
        assert socketio_client.is_connected()

        test_func(flask_client, socketio_client, *args, **kwargs)

    return inner
