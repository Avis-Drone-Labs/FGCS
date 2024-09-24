from . import falcon_test
from flask_socketio import SocketIOTestClient

from .helpers import send_and_recieve, NoDrone, FakeTCP


@falcon_test(pass_drone_status=True)
def test_gripperEnabled(socketio_client: SocketIOTestClient, droneStatus):
    # Failure on wrong drone state
    droneStatus.state = "params"
    assert send_and_recieve("gripper_enabled") == {
        "message": "You must be on the config screen to access the gripper."
    }

    # Failure with no drone connected
    droneStatus.state = "config"
    with NoDrone():
        assert send_and_recieve("gripper_enabled") == {
            "message": "You must be connected to the drone to access the gripper."
        }

    # Correct result on config page
    assert (
        send_and_recieve("gripper_enabled")
        == droneStatus.drone.gripperController.enabled
    )


@falcon_test(pass_drone_status=True)
def test_setGripper(socketio_client: SocketIOTestClient, droneStatus):
    # Failure on wrong drone state
    droneStatus.state = "params"
    assert send_and_recieve("set_gripper", "release") == {
        "message": "You must be on the config screen to access the gripper."
    }

    # Failure with no drone connected
    droneStatus.state = "config"
    with NoDrone():
        assert send_and_recieve("set_gripper", "release") == {
            "message": "You must be connected to the drone to access the gripper."
        }

    # Failure on incorrect gripper value
    assert send_and_recieve("set_gripper", "testgrippervalue") == {
        "message": 'Gripper action must be either "release" or "grab"'
    }

    # Success on release
    assert send_and_recieve("set_gripper", "release") == {
        "success": True,
        "message": "Setting gripper to release",
    }

    # Success on grab
    assert send_and_recieve("set_gripper", "grab") == {
        "success": True,
        "message": "Setting gripper to grab",
    }

    # Serial exception handled correctly
    with FakeTCP():
        assert send_and_recieve("set_gripper", "grab") == {
            "success": False,
            "message": "Setting gripper failed, serial exception",
        }

    # Failure when gripper is disabled
    droneStatus.drone.gripperController.enabled = False
    assert send_and_recieve("set_gripper", "grab") == {
        "success": False,
        "message": "Gripper is not enabled",
    }
    droneStatus.drone.gripperController.enabled = True
