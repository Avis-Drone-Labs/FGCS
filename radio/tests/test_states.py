from .helpers import NoDrone, send_and_receive


def test_setState_no_drone_connection(socketio_client, drone_status) -> None:
    """Test that setState succeeds when no drone is connected"""
    with NoDrone():
        socketio_client.emit("set_state", {"state": "dashboard"})
        assert len(socketio_client.get_received()) == 0
        assert drone_status.state == "dashboard"


def test_setState_missing_state_parameter(socketio_client, drone_status) -> None:
    """Test that setState fails when state parameter is missing"""
    assert send_and_receive(socketio_client, "set_state", {}) == {
        "message": "Request to endpoint set_state missing value for parameter: state."
    }


def test_setState_dashboard_state(socketio_client, drone_status) -> None:
    """Test setting state to dashboard"""
    socketio_client.emit("set_state", {"state": "dashboard"})
    assert len(socketio_client.get_received()) == 0
    assert len(drone_status.drone.message_listeners) == 16


def test_setState_graphs_state(socketio_client, drone_status) -> None:
    """Test setting state to graphs"""
    drone_status.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "graphs"})
    assert len(socketio_client.get_received()) == 0
    assert len(drone_status.drone.message_listeners) == 6


def test_setState_config_flight_modes_state(socketio_client, drone_status) -> None:
    """Test setting state to config.flight_modes"""
    drone_status.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.flight_modes"})
    assert len(socketio_client.get_received()) == 0
    assert len(drone_status.drone.message_listeners) == 5


def test_setState_config_rc_state(socketio_client, drone_status) -> None:
    """Test setting state to config.rc"""
    drone_status.drone.message_listeners = {}

    socketio_client.emit("set_state", {"state": "config.rc"})
    assert len(socketio_client.get_received()) == 0
    assert len(drone_status.drone.message_listeners) == 5
