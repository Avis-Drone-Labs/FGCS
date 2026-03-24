import time

import pytest
from flask_socketio.test_client import SocketIOTestClient

from .helpers import FakeTCP, NoDrone

ARM_RETRY_MAX_ATTEMPTS = 5
ARM_RETRY_DELAY_SECS = 2


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


def arm_with_retries(droneStatus) -> None:
    """Retry direct arming for transient pre-arm check failures."""
    for _ in range(ARM_RETRY_MAX_ATTEMPTS):
        if droneStatus.drone.armed:
            return

        droneStatus.drone.master.arducopter_arm()
        time.sleep(ARM_RETRY_DELAY_SECS)

        if droneStatus.drone.armed and bool(droneStatus.drone.master.motors_armed()):
            return

    raise AssertionError(
        f"Failed to arm after {ARM_RETRY_MAX_ATTEMPTS} attempts with "
        f"{ARM_RETRY_DELAY_SECS}s delay"
    )


def emit_arm_with_retries(
    socketio_client: SocketIOTestClient, force: bool = False
) -> dict:
    """Retry arm_disarm emit until success or max attempts are reached."""
    payload = {"arm": True}
    if force:
        payload["force"] = True

    last_response = None
    for _ in range(ARM_RETRY_MAX_ATTEMPTS):
        socketio_client.emit("arm_disarm", payload)
        received = socketio_client.get_received()

        if not received:
            time.sleep(ARM_RETRY_DELAY_SECS)
            continue

        last_response = received[0]["args"][0]
        if last_response.get("success"):
            return last_response

        time.sleep(ARM_RETRY_DELAY_SECS)

    if last_response is not None:
        return last_response

    raise AssertionError("No response received for arm_disarm during retries")


def test_arm_succeeds_when_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    response = emit_arm_with_retries(socketio_client)

    assert response == {
        "success": True,
        "message": "Armed successfully",
        "data": {
            "was_disarming": False,
            "was_force": False,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


def test_arm_fails_when_already_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
        "data": {
            "was_disarming": False,
            "was_force": False,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


def test_disarm_succeeds_when_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
        "data": {
            "was_disarming": True,
            "was_force": False,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


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
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


def test_force_arm_succeeds_when_disarmed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    assert_drone_armed(droneStatus, armed=False)

    response = emit_arm_with_retries(socketio_client, force=True)

    assert response == {
        "success": True,
        "message": "Armed successfully",
        "data": {
            "was_disarming": False,
            "was_force": True,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


def test_force_arm_fails_when_already_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": True, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
        "data": {
            "was_disarming": False,
            "was_force": True,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=True)


def test_force_disarm_succeeds_when_armed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
        "data": {
            "was_disarming": True,
            "was_force": True,
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


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
            "offer_force": False,
        },
    }
    assert_drone_armed(droneStatus, armed=False)


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
                "offer_force": False,
            },
        }


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
                "offer_force": False,
            },
        }


def test_disarm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
            "data": {
                "was_disarming": True,
                "was_force": False,
                "offer_force": False,
            },
        }


def test_force_disarm_fails_with_serial_exception(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    arm_with_retries(droneStatus)
    assert_drone_armed(droneStatus, armed=True)

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False, "force": True})

        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
            "data": {
                "was_disarming": True,
                "was_force": True,
                "offer_force": False,
            },
        }


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


def test_arm_disarm_fails_with_missing_arm_parameter(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    socketio_client.emit("arm_disarm", {})

    result = socketio_client.get_received()[0]
    assert result["name"] == "drone_error"
    assert result["args"][0] == {
        "message": "Request to endpoint arm_disarm missing value for parameter: arm."
    }
