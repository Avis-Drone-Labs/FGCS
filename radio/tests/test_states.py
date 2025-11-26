from flask_socketio import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone, send_and_receive


@falcon_test(pass_drone_status=True)
def test_setState_no_drone_connection(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test that setState fails when no drone is connected"""
    with NoDrone():
        assert send_and_receive("set_state", "dashboard") == {
            "message": "Must be connected to the drone to set the drone state."
        }


@falcon_test(pass_drone_status=True)
def test_setState_missing_state_parameter(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test that setState fails when state parameter is missing"""
    assert send_and_receive("set_state", {}) == {
        "message": "Request to endpoint set_state missing value for parameter: state."
    }


@falcon_test(pass_drone_status=True)
def test_setState_dashboard_state(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test setting state to dashboard"""
    socketio_client.emit("set_state", {"state": "dashboard"})
    assert len(socketio_client.get_received()) == 0
    # TODO: These values don't seem right to me, they don't include the STATUSTEXT listener?
    assert len(droneStatus.drone.message_listeners) == 15


@falcon_test(pass_drone_status=True)
def test_setState_graphs_state(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test setting state to graphs"""
    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "graphs"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 6


@falcon_test(pass_drone_status=True)
def test_setState_config_flight_modes_state(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test setting state to config.flight_modes"""
    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.flight_modes"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 4


@falcon_test(pass_drone_status=True)
def test_setState_config_rc_state(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    """Test setting state to config.rc"""
    droneStatus.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.rc"})
    assert len(socketio_client.get_received()) == 0
    assert len(droneStatus.drone.message_listeners) == 4


# TODO: Sort this out
# @falcon_test(pass_drone_status=True)
# def test_setState_params_state(socketio_client: SocketIOTestClient, droneStatus) -> None:
#     """Test setting state to params"""
#     # pytest.skip(reason="Issues with parameterController to be fixed in alpha 0.1.8")
#     droneStatus.drone.message_listeners = {}
#
#     socketio_client.emit("set_state", {"state": "params"})
#     time.sleep(15)
#     assert len(socketio_client.get_received()[-1]["args"][0]) == 1400
#     assert len(droneStatus.drone.message_listeners) == 1
