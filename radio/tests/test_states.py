import time

import pytest
from flask_socketio import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone, send_and_recieve


def stream_is_active(msg):
    # TODO: THIS DOESNT WORK YAYYYYYYYYYYYYY
    return True


@falcon_test(pass_drone_status=True)
def test_setState(socketio_client: SocketIOTestClient, droneStatus) -> None:
    # Failure on no drone connection
    with NoDrone():
        assert send_and_recieve("set_state", "dashboard") == {
            "message": "Must be connected to the drone to set the drone state."
        }

    # Failure on no state sent
    assert send_and_recieve("set_state", {}) == {
        "message": "Request to endpoint set_state missing value for parameter: state."
    }

    # Success on changing state to dashboard
    socketio_client.emit("set_state", {"state": "dashboard"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 13

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "graphs"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 3

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.flight_modes"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 2

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.rc"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 0

    droneStatus.drone.message_listeners = {}

    pytest.skip(reason="Issues with parameterController to be fixed in alpha 0.1.8")
    socketio_client.emit("set_state", {"state": "params"})
    time.sleep(15)
    assert len(socketio_client.get_received()[-1]["args"][0]) == 1400
    assert len(droneStatus.drone.message_listeners) == 0
