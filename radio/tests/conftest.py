import app.droneStatus as droneStatus  # noqa: F401
import pytest
from app.drone import Drone
from app.utils import getComPort


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
