import pytest
from serial.tools import list_ports
from serial.tools.list_ports_common import ListPortInfo

from app import droneStatus
from . import socketio_client
from .helpers import send_and_recieve
from .conftest import setupDrone

global VALID_DRONE_PORT


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Saves the valid connection string then ensures that the drone connection is established again after the tests have run
    """
    global VALID_DRONE_PORT
    VALID_DRONE_PORT = droneStatus.drone.port

    # Get the connection string
    if isinstance(VALID_DRONE_PORT, ListPortInfo):
        VALID_DRONE_PORT = ListPortInfo.device
    droneStatus.drone.logger.info(f"Found drone running on port {VALID_DRONE_PORT}")
    yield

    setupDrone(VALID_DRONE_PORT)
    droneStatus.drone.logger.info(f"Re-connected to drone on {VALID_DRONE_PORT}")


def test_getComPort() -> None:
    # TODO: we should automate different OS environments for our unit tests maybe?
    assert (
        send_and_recieve("get_com_ports")
        == [f"{port.name}: {port.description}" for port in list_ports.comports()]
        == droneStatus.correct_ports
    )


# Only run serial connection test if tests are being run with a serial connection to the drone
@pytest.mark.skipif(
    not droneStatus.drone.port.startswith("COM"),
    reason="Simulator in use. Only network connection can be tested.",
)
def test_connectToDrone_serial() -> None:
    SIM_PORT = droneStatus.drone.port
    # Failure on no port specified
    assert send_and_recieve("connect_to_drone", {"connectionType": "serial"}) == {
        "message": "COM port not specified."
    }

    # Failure on bad port specified
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "serial", "port": "testport"}
    ) == {"message": "COM port not found."}
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "serial", "port": "COM10:5761"}
    ) == {"message": "COM port not found."}

    # Success on correct port
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "serial", "port": SIM_PORT}
    ) == {"aircraft_type": 2}
    assert droneStatus.drone.port == SIM_PORT

    # Success on disconnect
    socketio_client.emit("disconnect_from_drone")
    assert socketio_client.get_received()[0]["name"] == "disconnected_from_drone"
    assert droneStatus.drone is None
    assert droneStatus.state is None

    # Reconnect to the drone


# Only run network connection test if tests are being run with a network connection to the drone
@pytest.mark.skipif(
    not droneStatus.drone.port.startswith("tcp"),
    reason="Physical connection is being used. Only serial connection can be tested.",
)
def test_connectToDrone_network() -> None:
    SIM_PORT = droneStatus.drone.port
    # Failure on no port specified
    assert send_and_recieve("connect_to_drone", {"connectionType": "network"}) == {
        "message": "Connection address not specified."
    }

    # Failure on bad port specified
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "testport"}
    ) == {
        "message": "could not open port 'testport': FileNotFoundError(2, 'The system cannot "
        + "find the file specified.', None, 2)"
    }
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "tcp:127.0.0.1:5761"}
    ) == {
        "message": "[WinError 10061] No connection could be made because the target machine "
        + "actively refused it"
    }

    # Success on correct port
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT}
    ) == {"aircraft_type": 2}
    assert droneStatus.drone.port == SIM_PORT

    # Success on disconnect
    socketio_client.emit("disconnect_from_drone")
    assert socketio_client.get_received()[0]["name"] == "disconnected_from_drone"
    assert droneStatus.drone is None
    assert droneStatus.state is None

    # TODO: Invalid baud rates are not handled, should they be?
