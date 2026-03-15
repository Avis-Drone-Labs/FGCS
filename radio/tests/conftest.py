import app.droneStatus as droneStatus  # noqa: F401
import pytest
from app.drone import Drone
from app.utils import getComPort
from app.customTypes import VehicleType


def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line(
        "markers", "plane_only: mark test to run only on plane SITL"
    )
    config.addinivalue_line(
        "markers", "copter_only: mark test to run only on copter SITL"
    )


def setupDrone(connectionString: str) -> bool:
    """
    Setup the drone globally, this is done before running pytest

    Args:
        connectionString (str): Either the port for a physical device or network connection string for a simulator
    """
    global droneStatus

    drone = Drone(connectionString)

    if drone.master is None:
        return False

    droneStatus.drone = drone
    return True


def pytest_addoption(parser):
    parser.addoption("--fc", action="store_true")


def pytest_sessionstart(session):
    """
    Called after the Session object has been created and
    before performing collection and entering the run test loop.
    """
    global droneStatus

    connection_string = "tcp:127.0.0.1:5760"

    if session.config.getoption("--fc"):
        print("\033[1;31;40mRUNNING TESTS WITH A PHYSICAL DEVICE \033[0m")
        connection_string = getComPort()

    else:
        print("\033[1;31;40mRUNNING TESTS WITH A SIMULATOR \033[0m")

    success = setupDrone(connection_string)

    if not success:
        print("\033[1;31;40mFAILED TO CONNECT TO DRONE, EXITING TESTS\033[0m")
        pytest.exit(1)


@pytest.fixture(autouse=True)
def check_aircraft_type(request):
    """Fixture to skip tests based on aircraft type markers"""

    markers = [marker.name for marker in request.node.iter_markers()]

    if droneStatus.drone is None:
        pytest.skip("No drone connected")
        return

    aircraft_type = droneStatus.drone.aircraft_type

    # Skip if marked as plane_only but not a plane
    if "plane_only" in markers and aircraft_type != VehicleType.FIXED_WING.value:
        pytest.skip(f"Test requires plane SITL (current type: {aircraft_type})")

    # Skip if marked as copter_only but not a copter
    if "copter_only" in markers and aircraft_type != VehicleType.MULTIROTOR.value:
        pytest.skip(f"Test requires copter SITL (current type: {aircraft_type})")
