import time

import pytest
from flask_socketio import SocketIOTestClient
from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from . import falcon_test
from .helpers import FakeTCP, NoDrone, send_and_receive, set_params


@pytest.fixture(scope="session", autouse=True)
def setup_function():
    """
    Setup parameters before all tests run
    """

    params = [
        ("GRIP_ENABLE", 1, mavlink.MAV_PARAM_TYPE_UINT8),
    ]

    set_params(params)


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """Adds a guaranteed delay of 1s after the tests have finished running to ensure
    all actions related to the gripper have completed
    """
    from app import droneStatus

    droneStatus.drone.paramsController.getAllParams()
    time.sleep(0.5)
    while droneStatus.drone.paramsController.is_requesting_params:
        pass
    yield

    # Ensure gripper is definitely re-enabled even if tests pass
    droneStatus.drone.paramsController.setParam(
        "GRIP_ENABLE", 1, mavutil.mavlink.MAV_PARAM_TYPE_REAL32
    )
    time.sleep(0.5)


@falcon_test(pass_drone_status=True)
def test_gripperEnabled(socketio_client: SocketIOTestClient, droneStatus):
    # Failure with no drone connected
    droneStatus.state = "config.gripper"
    with NoDrone():
        assert send_and_receive("get_gripper_enabled") == {
            "message": "You must be connected to the drone to access the gripper."
        }

    # Correct result on config page
    assert send_and_receive("get_gripper_enabled") is True


@falcon_test(pass_drone_status=True)
def test_setGripper(socketio_client: SocketIOTestClient, droneStatus):
    # Failure on wrong drone state
    droneStatus.state = "params"
    assert send_and_receive("set_gripper", "release") == {
        "message": "You must be on the config screen to access the gripper."
    }

    # Failure with no drone connected
    droneStatus.state = "config.gripper"
    with NoDrone():
        assert send_and_receive("set_gripper", "release") == {
            "message": "You must be connected to the drone to access the gripper."
        }

    # Failure on incorrect gripper value
    assert send_and_receive("set_gripper", "testgrippervalue") == {
        "message": 'Gripper action must be either "release" or "grab"'
    }

    # Success on release
    assert send_and_receive("set_gripper", "release") == {
        "success": True,
        "message": "Setting gripper to release",
    }

    # Success on grab
    assert send_and_receive("set_gripper", "grab") == {
        "success": True,
        "message": "Setting gripper to grab",
    }

    # Serial exception handled correctly
    with FakeTCP():
        assert send_and_receive("set_gripper", "grab") == {
            "success": False,
            "message": "Setting gripper failed, serial exception",
        }


@falcon_test(pass_drone_status=True)
def test_gripperDisabled(socketio_client: SocketIOTestClient, droneStatus) -> None:
    droneStatus.drone.paramsController.setParam(
        "GRIP_ENABLE", 0, mavutil.mavlink.MAV_PARAM_TYPE_REAL32
    )
    # Allow time for gripper to be updated
    time.sleep(0.5)

    assert send_and_receive("get_gripper_enabled") is False
    assert send_and_receive("set_gripper", "release") == {
        "success": False,
        "message": "Gripper is not enabled",
    }


@falcon_test()
def test_setGripperEnabled(socketio_client: SocketIOTestClient) -> None:
    assert send_and_receive("set_gripper_enabled") == {
        "success": True,
        "message": "Enabled gripper",
    }


@falcon_test()
def test_setGripperDisabled(socketio_client: SocketIOTestClient) -> None:
    assert send_and_receive("set_gripper_disabled") == {
        "success": True,
        "message": "Disabled gripper",
    }
