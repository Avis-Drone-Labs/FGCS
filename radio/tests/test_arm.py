import time
import pytest

from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import FakeTCP


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Saves the valid connection string then ensures that the drone connection is established again after the tests have run
    """
    from app import droneStatus

    assert not droneStatus.drone.armed
    yield
    assert not droneStatus.drone.armed


def assert_drone_armed(droneStatus, armed: bool) -> None:
    assert droneStatus.drone.armed == armed
    assert bool(droneStatus.drone.master.motors_armed()) == armed


@falcon_test(pass_drone_status=True)
def test_arm_disarm_normal(socketio_client: SocketIOTestClient, droneStatus) -> None:
    time.sleep(10)
    # Test arm normally
    assert_drone_armed(droneStatus, armed=False)
    socketio_client.emit(
        "arm_disarm",
        {
            "arm": True,
        },
    )
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
    }
    assert_drone_armed(droneStatus, armed=True)

    # Test arming failure if already armed
    socketio_client.emit("arm_disarm", {"arm": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
    }
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
    }
    assert_drone_armed(droneStatus, armed=False)

    # Test disarm failure when not armed
    socketio_client.emit("arm_disarm", {"arm": False})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_arm_disarm_force(socketio_client: SocketIOTestClient, droneStatus) -> None:
    # Test arm normally
    assert_drone_armed(droneStatus, armed=False)
    socketio_client.emit("arm_disarm", {"arm": True, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
    }
    assert_drone_armed(droneStatus, armed=True)

    # Test arming failure if already armed
    socketio_client.emit("arm_disarm", {"arm": True, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
    }
    assert_drone_armed(droneStatus, armed=True)

    socketio_client.emit("arm_disarm", {"arm": False, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
    }
    assert_drone_armed(droneStatus, armed=False)

    # Test disarm failure when not armed
    socketio_client.emit("arm_disarm", {"arm": False, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
    }
    assert_drone_armed(droneStatus, armed=False)


@falcon_test(pass_drone_status=True)
def test_arm_disarm_exception(socketio_client: SocketIOTestClient, droneStatus):
    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm, serial exception",
        }
        socketio_client.emit("arm_disarm", {"arm": True, "force": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm, serial exception",
        }

    socketio_client.emit("arm_disarm", {"arm": True})

    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False})
        assert socketio_client.get_received()[1]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
        }
        socketio_client.emit("arm_disarm", {"arm": False, "force": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm, serial exception",
        }
    socketio_client.emit("arm_disarm", {"arm": False})
    socketio_client.get_received()
    assert_drone_armed(droneStatus, armed=False)


@pytest.mark.skip("GPS failure fixture is broken")
def test_arm_no_gps(gps_failure) -> None:
    from . import socketio_client

    # Test losing GPS lock when attempting to arm. Assert needs to be outside the context manager because
    socketio_client.emit("arm_disarm", {"arm": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Could not arm, command not accepted",
    }
    socketio_client.emit("arm_disarm", {"arm": True, "force": True})

    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
    }
