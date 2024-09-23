import sys
import pytest
from serial.tools import list_ports
from serial.tools.list_ports_common import ListPortInfo

from app import droneStatus
from app.drone import Drone
from . import socketio_client
from .helpers import send_and_recieve
from .conftest import setupDrone

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


# Only run serial connection test if tests are being run with a serial connection to the drone
@pytest.mark.skipif(
    droneStatus.drone is not None and not droneStatus.drone.port.startswith("COM"),
    reason="Simulator in use. Only network connection can be tested.",
)
def test_connectToDrone_serial() -> None:
    global VALID_DRONE_PORT
    SIM_PORT = VALID_DRONE_PORT
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
    assert droneStatus.drone is not None
    assert droneStatus.drone.port == SIM_PORT

    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": "network", "port": SIM_PORT, "baud": 9600},
    ) == {"aircraft_type": 2}
    assert droneStatus.drone is not None
    assert droneStatus.drone.baud == 9600
    assert droneStatus.drone.master.baud == 9600

    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT, "baud": -1}
    ) == {
        "message": f"{-1} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT, "baud": 110}
    ) == {
        "message": f"{110} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }

    # Success on disconnect
    socketio_client.emit("disconnect_from_drone")
    assert socketio_client.get_received()[0]["name"] == "disconnected_from_drone"
    assert droneStatus.drone is None
    assert droneStatus.state is None

    # Reconnect to the drone


# Only run network connection test if tests are being run with a network connection to the drone
@pytest.mark.skipif(
    droneStatus.drone is not None and not droneStatus.drone.port.startswith("tcp"),
    reason="Physical connection is being used. Only serial connection can be tested.",
)
def test_connectToDrone_network() -> None:
    global VALID_DRONE_PORT
    SIM_PORT = VALID_DRONE_PORT
    # Failure on no port specified
    assert send_and_recieve("connect_to_drone", {"connectionType": "network"}) == {
        "message": "Connection address not specified."
    }

    # Failure on bad port specified
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "testport"}
    ) == {"message": "Could not connect to drone, invalid port."}
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": "tcp:127.0.0.1:5761"}
    ) == {"message": "Could not connect to drone, connection refused."}

    # Success on correct port
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT}
    ) == {"aircraft_type": 2}
    assert droneStatus.drone is not None
    assert droneStatus.drone.port == SIM_PORT

    assert send_and_recieve(
        "connect_to_drone",
        {"connectionType": "network", "port": SIM_PORT, "baud": 9600},
    ) == {"aircraft_type": 2}
    assert droneStatus.drone is not None
    assert droneStatus.drone.baud == 9600

    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT, "baud": -1}
    ) == {
        "message": f"{-1} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }
    assert send_and_recieve(
        "connect_to_drone", {"connectionType": "network", "port": SIM_PORT, "baud": 110}
    ) == {
        "message": f"{110} is an invalid baudrate. Valid baud rates are {Drone.getValidBaudrates()}"
    }

    # Success on disconnect
    socketio_client.emit("disconnect_from_drone")
    assert socketio_client.get_received()[0]["name"] == "disconnected_from_drone"
    assert droneStatus.drone is None
    assert droneStatus.state is None
