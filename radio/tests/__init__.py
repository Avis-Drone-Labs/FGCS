import app.droneStatus as droneStatus
from typing import Callable, Optional
from app import create_app, socketio
from app.drone import Drone

import pytest
from flask_socketio.test_client import SocketIOTestClient
from flask.testing import FlaskClient

app = create_app(debug=True)
socketio = socketio
drone: Optional[Drone] = None

# Create flask/socketio clients to be used in tests
flask_client: FlaskClient = app.test_client()
socketio_client: SocketIOTestClient = socketio.test_client(
    app, flask_test_client=flask_client
)


def falcon_test(
    pass_drone_status: bool = False, pass_flask: bool = False, pass_drone: bool = False
):
    """
    A wrapper to connect to backend and pass necessary details to test function

    Args:
        pass_drone_status (bool): True if you want to accept the droneStatus file to the test func
        pass_flask (bool): True if you want to accept the flask_test_client file to the test func
        pass_drone (bool): Pass the drone object created at the start of the file's test
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
            if pass_drone:
                passing_variables["drone"] = drone

            # Run test
            if drone is None and pass_drone:
                pytest.skip("Passing as no flight controller was found.")
            else:
                test_func(socketio_client, *args, **passing_variables, **kwargs)

        return inner

    return run_test


def setupDrone(givenDrone: Drone) -> None:
    """
    Setup the drone globally, this is done before running pytest

    Args:
        givenDrone (Drone): The drone object to be used within the tests
    """
    global drone
    drone = givenDrone
