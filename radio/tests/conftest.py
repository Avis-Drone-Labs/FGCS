import app.droneStatus as droneStatus  # noqa: F401
import pytest
import time

from app.drone import Drone
from app.utils import getComPort
from logging import getLogger
from pymavlink import mavutil


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


def waitUntilCalibrated() -> None:
    """Requests SYS_STATUS messages and blocks until the message indicates that the sensor
    health is in order. It is always 1467063343 when the sensors are healthy
    """

    assert droneStatus.drone is not None  # Begone mypy!

    testLogger = getLogger("test")
    testLogger.info("Waiting until systems have calibrated")
    sensor_health = [0]

    def set_sensor_health(statustext):
        sensor_health.append(int(statustext.onboard_control_sensors_health))

    droneStatus.drone.addMessageListener("SYS_STATUS", set_sensor_health)
    droneStatus.drone.setupSingleDataStream(
        mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
    )

    while sensor_health[-1] != 1467063343:
        testLogger.debug("Systems calibrating")
        time.sleep(0.1)

    getLogger("test").info("All systems calibrated successfully")
    droneStatus.drone.stopAllDataStreams()


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

    waitUntilCalibrated()
