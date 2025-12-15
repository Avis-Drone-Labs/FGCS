import time

import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import FakeTCP, NoDrone


@pytest.fixture(scope="module", autouse=True)
def run_once_before_all_tests():
    """
    Ensures that the drone is disarmed once and the proper flight mode is set before all tests in this module
    """
    from app import droneStatus

    # Setup: Disarm before tests and set the flight mode
    droneStatus.drone.master.arducopter_disarm()
    wait_for_disarm(droneStatus)
    droneStatus.drone.master.set_mode_apm("STABILIZE")

    yield


@pytest.fixture(autouse=True)
def disarm_after_each_test():
    """
    Ensures that the drone is disarmed after each individual test
    """
    from app import droneStatus

    # Run the test
    yield

    # Teardown: Disarm after each test
    droneStatus.drone.master.arducopter_disarm()
    wait_for_disarm(droneStatus)


def wait_for_disarm(droneStatus) -> None:
    """Waits until the drone is disarmed"""
    timeout = time.time() + 10  # 10 seconds from now
    while droneStatus.drone.armed:
        if time.time() > timeout:
            raise TimeoutError("Timed out waiting for drone to disarm")
        time.sleep(0.05)


def assert_drone_armed(droneStatus, armed: bool) -> None:
    time.sleep(1)  # Give some time for the state to update
    assert droneStatus.drone.armed == armed
    assert bool(droneStatus.drone.master.motors_armed()) == armed


@falcon_test(pass_drone_status=True)
def test_arm_succeeds_when_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    socketio_client.emit("arm_disarm", {"arm": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
        "data": {
            "was_disarming": False,
            "was_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


@falcon_test(pass_drone_status=True)
def test_arm_fails_when_already_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
        "data": {
            "was_disarming": False,
            "was_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


@falcon_test(pass_drone_status=True)
def test_disarm_succeeds_when_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
        "data": {
            "was_disarming": True,
            "was_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_disarm_fails_when_already_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    socketio_client.emit("arm_disarm", {"arm": False})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
        "data": {
            "was_disarming": True,
            "was_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_force_arm_succeeds_when_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    socketio_client.emit("arm_disarm", {"arm": True, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
        "data": {
            "was_disarming": False,
            "was_force": True,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


@falcon_test(pass_drone_status=True)
def test_force_arm_fails_when_already_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": True, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
        "data": {
            "was_disarming": False,
            "was_force": True,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


@falcon_test(pass_drone_status=True)
def test_force_disarm_succeeds_when_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
        "data": {
            "was_disarming": True,
            "was_force": True,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_force_disarm_fails_when_already_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    socketio_client.emit("arm_disarm", {"arm": False, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
        "data": {
            "was_disarming": True,
            "was_force": True,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_arm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": True})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm, serial exception",
            "data": {
                "was_disarming": False,
                "was_force": False,
            },
        }


@falcon_test(pass_drone_status=True)
def test_force_arm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": True, "force": True})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm, serial exception",
            "data": {
                "was_disarming": False,
                "was_force": True,
            },
        }


@falcon_test(pass_drone_status=True)
def test_disarm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
            "data": {
                "was_disarming": True,
                "was_force": False,
            },
        }


@falcon_test(pass_drone_status=True)
def test_force_disarm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.drone.master.arducopter_arm()
    time.sleep(1)
    assert_drone_armed(droneStatus, armed=True)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False, "force": True})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
            "data": {
                "was_disarming": True,
                "was_force": True,
            },
        }


@falcon_test(pass_drone_status=True)
def test_arm_fails_when_no_drone_connected(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    with NoDrone():
        socketio_client.emit("arm_disarm", {"arm": True})

        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert result["args"][0] == {
            "message": "Must be connected to the drone to arm or disarm."
        }


@falcon_test(pass_drone_status=True)
def test_force_disarm_fails_when_no_drone_connected(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    with NoDrone():
        socketio_client.emit("arm_disarm", {"arm": False, "force": True})

        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert result["args"][0] == {
            "message": "Must be connected to the drone to arm or disarm."
        }


@falcon_test(pass_drone_status=True)
def test_arm_disarm_fails_with_missing_arm_parameter(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    socketio_client.emit("arm_disarm", {})

    result = socketio_client.get_received()[0]
    assert result["name"] == "drone_error"
    assert result["args"][0] == {
        "message": "Request to endpoint arm_disarm missing value for parameter: arm."
    }
