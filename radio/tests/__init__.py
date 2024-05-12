# The below is done so we cna import from ../app
import sys
sys.path.append("..")

from typing import Callable
from app import create_app, socketio
from flask_socketio.test_client import SocketIOTestClient
from flask.testing import FlaskClient
import app.droneStatus as droneStatus

app = create_app(debug=True)
socketio = socketio


def falcon_test(pass_drone: bool = False, pass_flask: bool = False):
    """
    A wrapper to connect to backend and pass necessary details to test function

    Args:
        pass_drone (bool): True if you want to accept the droneStatus file to the test func
        pass_flask (bool): True if you want to accept the flask_test_client file to the test func
    """

    def run_test(test_func: Callable = None):
        """Inner wrapper to run test"""

        if test_func is None:
            raise ValueError("You forgot to write parenthesis around falcon_test() so test_func was set to None")

        def inner(*args, **kwargs):
            # Create flask/socketio client to be used in each test
            flask_client: FlaskClient = app.test_client()
            socketio_client: SocketIOTestClient = socketio.test_client(app, flask_test_client=flask_client)

            # Make sure the server did not rejected the connection
            assert socketio_client.is_connected()

            # Get variables to pass into test_func
            passing_variables = {}
            if pass_drone:
                passing_variables["droneStatus"] = droneStatus
            if pass_flask:
                passing_variables["flask_client"] = flask_client

            # Run test
            test_func(socketio_client, *args, **passing_variables, **kwargs)

        return inner
    return run_test
