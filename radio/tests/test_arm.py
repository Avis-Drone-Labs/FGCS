import time

from pymavlink import mavutil
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test, FakeTCP


def direct_arm_disarm(droneStatus, arm: bool):
    """
    Arm / disarm directly using pymavlink as opposed to in-house wrappers, for altering the simulation armed state during
    testing
    """

    droneStatus.drone.master.mav.command_long_send(
        droneStatus.drone.master.target_system,
        droneStatus.drone.master.target_component,
        mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
        0,
        1 if arm else 0,
        0,
        0,
        0,
        0,
        0,
        0,
    )
    if arm:
        while not droneStatus.drone.master.motors_armed():
            time.sleep(0.05)
    else:
        while droneStatus.drone.master.motors_armed():
            time.sleep(0.05)


@falcon_test(pass_drone_status=True)
def test_arm(socketio_client: SocketIOTestClient, droneStatus) -> None:
    # Test arm normally
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
    assert droneStatus.drone.armed

    # Test arming failure if already armed
    socketio_client.emit("arm_disarm", {"arm": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
    }
    direct_arm_disarm(droneStatus, arm=False)

    # Test force arm
    socketio_client.emit("arm_disarm", {"arm": True, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Armed successfully",
    }

    # Test force arm fail when already armed
    socketio_client.emit("arm_disarm", {"arm": True, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already armed",
    }

    direct_arm_disarm(droneStatus, arm=False)
    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm",
        }
        socketio_client.emit("arm_disarm", {"arm": True, "force": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not arm",
        }


@falcon_test(pass_drone_status=True)
def test_disarm(socketio_client: SocketIOTestClient, droneStatus) -> None:
    # Arming has been tested so we can use it (surely)
    direct_arm_disarm(droneStatus, arm=True)
    socketio_client.emit("arm_disarm", {"arm": False})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
    }

    # Test disarm failure when not armed
    socketio_client.emit("arm_disarm", {"arm": False})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
    }

    # Test force disarm
    direct_arm_disarm(droneStatus, arm=True)
    socketio_client.emit("arm_disarm", {"arm": False, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": True,
        "message": "Disarmed successfully",
    }

    # Test force disarm failure when not armed
    socketio_client.emit("arm_disarm", {"arm": False, "force": True})
    assert socketio_client.get_received()[0]["args"][0] == {
        "success": False,
        "message": "Already disarmed",
    }

    # Test disarm failure on socket exception
    direct_arm_disarm(droneStatus, arm=True)
    with FakeTCP():
        socketio_client.emit("arm_disarm", {"arm": False})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm",
        }
        socketio_client.emit("arm_disarm", {"arm": False, "force": True})
        assert socketio_client.get_received()[0]["args"][0] == {
            "success": False,
            "message": "Could not disarm",
        }
