import pytest
from typing import Callable, Optional
from flask.testing import FlaskClient
from flask_socketio.test_client import SocketIOTestClient

from app import create_app, socketio
import app.droneStatus as droneStatus

app = create_app(debug=True)
socketio = socketio

# Create flask/socketio clients to be used in tests
flask_client: FlaskClient = app.test_client()
socketio_client: SocketIOTestClient = socketio.test_client(
    app, flask_test_client=flask_client
)


def falcon_test(pass_drone_status: bool = False, pass_flask: bool = False) -> Callable:
    """
    A wrapper to connect to backend and pass necessary details to test function

    Args:
        pass_drone_status (bool): True if you want to accept the droneStatus file to the test func
        pass_flask (bool): True if you want to accept the flask_test_client file to the test func
    """

    def run_test(test_func: Optional[Callable] = None):
        """Inner wrapper to run test"""

        if test_func is None:
            raise ValueError(
                "You forgot to write parenthesis around falcon_test() so test_func was set to None"
            )

        def inner(*args, **kwargs):
            # Make sure the server did not rejected the connection
            assert socketio_client.is_connected()

            # Get variables to pass into test_func
            passing_variables = {}
            if pass_drone_status:
                passing_variables["droneStatus"] = droneStatus
            if pass_flask:
                passing_variables["flask_client"] = flask_client

            # Run test
            if droneStatus.drone is None and pass_drone_status:
                pytest.skip("Passing as no flight controller was found.")
            else:
                test_func(socketio_client, *args, **passing_variables, **kwargs)

        return inner

    return run_test
