from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone


@falcon_test(pass_drone_status=True)
def test_getRcConfig_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("get_rc_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access the RC config."
    }


@falcon_test(pass_drone_status=True)
def test_getRcConfig_correctState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.rc"
    socketio_client.emit("get_rc_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "rc_config"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "pitch": 2.0,
        "roll": 1.0,
        "throttle": 3.0,
        "yaw": 4.0,
        "RC_1": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_2": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_3": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_4": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_5": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_6": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_7": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 7.0},
        "RC_8": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_9": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_10": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_11": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_12": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_13": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_14": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_15": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_16": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "flight_modes": 5.0,
    }


@falcon_test(pass_drone_status=True)
def test_getRcConfig_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    with NoDrone():
        socketio_client.emit("get_rc_config")
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"  # Correct name emitted
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to get the RC config."
        }
