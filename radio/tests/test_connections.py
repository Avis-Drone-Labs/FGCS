import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Saves the valid connection string then ensures that the drone connection is established again after the tests have run
    """
    from app import droneStatus

    from .conftest import setupDrone

    assert droneStatus.drone is not None
    VALID_DRONE_PORT = droneStatus.drone.port

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
def test_getTargetInfo(socketio_client: SocketIOTestClient, droneStatus):
    socketio_client.emit("get_target_info")
    socketio_result = socketio_client.get_received()

    assert len(socketio_result) == 1
    assert socketio_result[0]["name"] == "target_info"
    assert socketio_result[0]["args"][0] == {
        "target_component": 0,
        "target_system": 1,
    }


@falcon_test(pass_drone_status=True)
def test_startForwarding_noDroneConnected(
    socketio_client: SocketIOTestClient, droneStatus
):
    with NoDrone():
        socketio_client.emit("start_forwarding", {"address": "udpout:127.0.0.1:14550"})
        socketio_result = socketio_client.get_received()

        assert socketio_result[0]["name"] == "forwarding_status"
        assert socketio_result[0]["args"][0] == {
            "success": False,
            "message": "Not connected to drone",
        }


@falcon_test(pass_drone_status=True)
def test_startForwarding_missingAddress(
    socketio_client: SocketIOTestClient, droneStatus
):
    socketio_client.emit("start_forwarding", {})
    socketio_result = socketio_client.get_received()

    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": False,
        "message": "No address provided",
    }


@falcon_test(pass_drone_status=True)
def test_startForwarding_badAddressFormat(
    socketio_client: SocketIOTestClient, droneStatus
):
    socketio_client.emit("start_forwarding", {"address": "invalid_address_format"})
    socketio_result = socketio_client.get_received()

    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": False,
        "message": "Address must be in the format udpout:IP:PORT or tcpout:IP:PORT",
    }

    socketio_client.emit("start_forwarding", {"address": "udpout::14550"})
    socketio_result = socketio_client.get_received()
    assert socketio_result[1]["name"] == "forwarding_status"
    assert socketio_result[1]["args"][0] == {
        "success": False,
        "message": "Address must be in the format udpout:IP:PORT or tcpout:IP:PORT",
    }

    socketio_client.emit("start_forwarding", {"address": "tcpout:192.168.1.:1450"})
    socketio_result = socketio_client.get_received()
    assert socketio_result[2]["name"] == "forwarding_status"
    assert socketio_result[2]["args"][0] == {
        "success": False,
        "message": "Address must be in the format udpout:IP:PORT or tcpout:IP:PORT",
    }


@falcon_test(pass_drone_status=True)
def test_startForwarding_success(socketio_client: SocketIOTestClient, droneStatus):
    socketio_client.emit("start_forwarding", {"address": "udpout:127.0.0.1:14550"})
    socketio_result = socketio_client.get_received()
    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": True,
        "message": "Started forwarding to udpout:127.0.0.1:14550",
    }
    assert droneStatus.drone.forwarding_address == "udpout:127.0.0.1:14550"


@falcon_test(pass_drone_status=True)
def test_startForwarding_alreadyForwarding(
    socketio_client: SocketIOTestClient, droneStatus
):
    assert droneStatus.drone.forwarding_address == "udpout:127.0.0.1:14550"
    socketio_client.emit("start_forwarding", {"address": "udpout:127.0.0.1:14550"})
    socketio_result = socketio_client.get_received()
    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": False,
        "message": "Already forwarding to address udpout:127.0.0.1:14550",
    }


@falcon_test(pass_drone_status=True)
def test_stopForwarding_noDroneConnected(
    socketio_client: SocketIOTestClient, droneStatus
):
    with NoDrone():
        socketio_client.emit("stop_forwarding")
        socketio_result = socketio_client.get_received()

        assert socketio_result[0]["name"] == "forwarding_status"
        assert socketio_result[0]["args"][0] == {
            "success": False,
            "message": "Not connected to drone",
        }


@falcon_test(pass_drone_status=True)
def test_stopForwarding_success(socketio_client: SocketIOTestClient, droneStatus):
    assert droneStatus.drone.forwarding_address == "udpout:127.0.0.1:14550"
    socketio_client.emit("stop_forwarding")
    socketio_result = socketio_client.get_received()
    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": True,
        "message": "Stopped forwarding",
    }
    assert droneStatus.drone.forwarding_address is None


@falcon_test(pass_drone_status=True)
def test_stopForwarding_notForwarding(socketio_client: SocketIOTestClient, droneStatus):
    assert droneStatus.drone.forwarding_address is None
    socketio_client.emit("stop_forwarding")
    socketio_result = socketio_client.get_received()
    assert socketio_result[0]["name"] == "forwarding_status"
    assert socketio_result[0]["args"][0] == {
        "success": False,
        "message": "Not currently forwarding",
    }


# Has to be the final test otherwise the socket disconnects
@falcon_test(pass_drone_status=True)
def test_disconnect(socketio_client: SocketIOTestClient, droneStatus):
    """Test disconnecting from socket"""
    socketio_client.emit("disconnect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back

    assert droneStatus.drone is None  # Drone has been reset
    assert droneStatus.state is None  # State has been reset
