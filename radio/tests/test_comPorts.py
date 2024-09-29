import sys
import pytest

from serial.tools import list_ports
from serial.tools.list_ports_common import ListPortInfo

from app import droneStatus
from app.drone import Drone
from . import socketio_client
from .conftest import setupDrone
from .helpers import send_and_recieve

VALID_DRONE_PORT: str | ListPortInfo


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Saves the valid connection string then ensures that the drone connection is established again after the tests have run
    """
    assert droneStatus.drone is not None
    global VALID_DRONE_PORT
    VALID_DRONE_PORT = droneStatus.drone.port

    # Get the connection string
    if isinstance(VALID_DRONE_PORT, ListPortInfo):
        VALID_DRONE_PORT = VALID_DRONE_PORT.device
    droneStatus.drone.logger.info(f"Found drone running on port {VALID_DRONE_PORT}")
    yield

    setupDrone(VALID_DRONE_PORT)
    droneStatus.drone.logger.info(f"Re-connected to drone on {VALID_DRONE_PORT}")


def get_comport_name(port):
    if sys.platform == "darwin":
        port_name = port.name
        if port_name[:3] == "cu.":
            port_name = port_name[3:]

        port_name = f"/dev/tty.{port_name}"
    elif sys.platform in ["linux", "linux2"]:
        port_name = f"/dev/{port.name}"
    else:
        port_name = port.name
    return port_name


def test_getComPort() -> None:
    # TODO: we should automate different OS environments for our unit tests maybe?
    assert (
        send_and_recieve("get_com_ports")
        == [
            f"{get_comport_name(port)}: {port.description}"
            for port in list_ports.comports()
        ]
        == droneStatus.correct_ports
    )


def test_connectToDrone_badType() -> None:
    # Failure on bad connection type
    assert send_and_recieve("connect_to_drone", {}) == {
        "message": "Connection type not specified."
    }
    assert send_and_recieve("connect_to_drone", {"connectionType": "testtype"}) == {
        "message": "Connection type not specified."
    }


def test_connectToDrone_badPort() -> None:
    # Failure on no port specified
    assert send_and_recieve("connect_to_drone", {"connectionType": "serial"}) == {
        "message": "COM port not specified."
    }
    assert send_and_recieve("connect_to_drone", {"connectionType": "network"}) == {
        "message": "Connection address not specified."
    }

    # Failure on bad port specified
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "serial", "port": "testport"}
    ) == {"message": "COM port not found."}
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "serial", "port": "COM10:5761"}
    ) == {"message": "COM port not found."}

    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "testport"}
    ) == {"message": "Could not connect to drone, invalid port."}
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "tcp:127.0.0.1:5761"}
    ) == {"message": "Could not connect to drone, connection refused."}


def test_connectToDrone_validConnection() -> None:
    global VALID_DRONE_PORT

    # If network connection then do network tests else do serial tests
    connectionType = (
        "network" if VALID_DRONE_PORT.startswith(("tcp", "udp")) else "serial"
    )

    # Success on correct port
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": connectionType, "port": VALID_DRONE_PORT}
    ) == {"aircraft_type": 2}
    assert droneStatus.drone is not None
    assert droneStatus.drone.port == VALID_DRONE_PORT
    assert droneStatus.drone.baud == 57600

    # Success on correct port with specified baud rate
    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": connectionType, "port": VALID_DRONE_PORT, "baud": 9600},
    ) == {"aircraft_type": 2}

    assert droneStatus.drone is not None
    assert droneStatus.drone.baud == 9600


def test_connectToDrone_badBaud() -> None:
    global VALID_DRONE_PORT

    # If network connection then do network tests else do serial tests
    connectionType = (
        "network" if VALID_DRONE_PORT.startswith(("tcp", "udp")) else "serial"
    )

    # Failure on invalid baud rate value
    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": connectionType, "port": VALID_DRONE_PORT, "baud": -1},
    ) == {
        "message": f"{-1} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }
    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": connectionType, "port": VALID_DRONE_PORT, "baud": 110},
    ) == {
        "message": f"{110} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }

    # Failure on invalid baud rate types
    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": connectionType, "port": VALID_DRONE_PORT, "baud": 9600.0},
    ) == {"message": "Expected integer value for baud, recieved float."}
    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": connectionType, "port": VALID_DRONE_PORT, "baud": "9600"},
    ) == {"message": "Expected integer value for baud, recieved str."}


def test_disconnectFromDrone() -> None:
    global VALID_DRONE_PORT

    # If network connection then do network tests else do serial tests
    connectionType = (
        "network" if VALID_DRONE_PORT.startswith(("tcp", "udp")) else "serial"
    )

    # Connect to drone in order to test disconnect
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": connectionType, "port": VALID_DRONE_PORT}
    ) == {"aircraft_type": 2}

    socketio_client.emit("disconnect_from_drone")
    assert socketio_client.get_received()[0]["name"] == "disconnected_from_drone"
