from flask_socketio import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone, send_and_receive


@falcon_test(pass_drone_status=True)
def test_setState(socketio_client: SocketIOTestClient, droneStatus) -> None:
    # Failure on no drone connection
    with NoDrone():
        assert send_and_receive("set_state", "dashboard") == {
            "message": "Must be connected to the drone to set the drone state."
        }

    # Failure on no state sent
    assert send_and_receive("set_state", {}) == {
        "message": "Request to endpoint set_state missing value for parameter: state."
    }

    # TODO: These values don't seem right to me, they don't include the STATUSTEXT listener?

    # Success on changing state to dashboard
    socketio_client.emit("set_state", {"state": "dashboard"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 16

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "graphs"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 6

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.flight_modes"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 4

    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.rc"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 4

    droneStatus.drone.message_listeners = {}

    # TODO: Sort this out
    # pytest.skip(reason="Issues with parameterController to be fixed in alpha 0.1.8")
    # socketio_client.emit("set_state", {"state": "params"})
    # time.sleep(15)
    # assert len(socketio_client.get_received()[-1]["args"][0]) == 1400
    # assert len(droneStatus.drone.message_listeners) == 1
