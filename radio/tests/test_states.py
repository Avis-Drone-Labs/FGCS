import time

from flask_socketio import SocketIOTestClient

from . import falcon_test
from .helpers import send_and_recieve, NoDrone


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
    assert len(droneStatus.drone.message_listeners) == 12

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "graphs"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 3

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 0

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.flight_modes"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 2

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.rc_calibration"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 0

    droneStatus.drone.message_listeners = {}

    # Test switch to params when parameters are not loaded
    droneStatus.drone.paramsController.params = []
    socketio_client.emit("set_state", {"state": "params"})
    while not (recieved := socketio_client.get_received()) or recieved[-1][
        "name"
    ] == "param_request_update":
        if not recieved:
            time.sleep(0.2)
        else:
            droneStatus.drone.logger.info(recieved[-1])
            assert recieved[-1]["args"][0]["total_number_of_params"] == 1400
            assert recieved[-1]["args"][0]["current_param_index"] <= 1400

    assert recieved[-1]["name"] == "params"
    assert len(recieved[-1]["args"][0]) == 1400
    assert len(droneStatus.drone.message_listeners) == 0

    # Test switching to params when parameters are already loaded
    socketio_client.emit("set_state", {"state": "params"})
    recieved = socketio_client.get_received()[0]
    assert recieved["name"] == "params"
    assert len(recieved["args"][0]) == 1400
    assert len(droneStatus.drone.message_listeners) == 0
