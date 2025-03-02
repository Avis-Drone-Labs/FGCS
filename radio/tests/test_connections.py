import pytest
from serial.tools.list_ports_common import ListPortInfo

from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Saves the valid connection string then ensures that the drone connection is established again after the tests have run
    """
    from app import droneStatus
    from .conftest import setupDrone

    assert droneStatus.drone is not None
    VALID_DRONE_PORT = droneStatus.drone.port

    # Get the connection string
    if isinstance(VALID_DRONE_PORT, ListPortInfo):
        VALID_DRONE_PORT = VALID_DRONE_PORT.device

    droneStatus.drone.logger.info(f"Found drone running on port {VALID_DRONE_PORT}")
    yield

    setupDrone(VALID_DRONE_PORT)
    droneStatus.drone.logger.info(f"Re-connected to drone on {VALID_DRONE_PORT}")


@falcon_test()
def test_connect(socketio_client: SocketIOTestClient):
    """Test connecting to socket"""
    socketio_client.emit("connect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back


@falcon_test(pass_drone_status=True)
def test_isConnectedToDrone_with_drone(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Test to see if the drone if we set it up"""
    socketio_client.emit("is_connected_to_drone")
    socketio_result = socketio_client.get_received()

    assert len(socketio_result) == 1  # Only 1 response
    assert socketio_result[0]["args"] == [True]  # droneStatus.drone is set
    assert socketio_result[0]["name"] == "is_connected_to_drone"  # Correct name emitted


@falcon_test(pass_drone_status=True)
def test_disconnect(socketio_client: SocketIOTestClient, droneStatus):
    """Test disconnecting from socket"""
    socketio_client.emit("disconnect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back

    assert droneStatus.drone is None  # Drone has been reset
    assert droneStatus.state is None  # State has been reset
