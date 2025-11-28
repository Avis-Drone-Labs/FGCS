import pytest
from flask_socketio.test_client import SocketIOTestClient
from pymavlink.mavutil import mavlink

from . import falcon_test
from .helpers import NoDrone, set_params


@pytest.fixture(scope="session", autouse=True)
def setup_function():
    """
    Setup parameters before all tests run
    """

    params = [
        ("FRAME_TYPE", 0, mavlink.MAV_PARAM_TYPE_UINT8),
        ("FRAME_CLASS", 1, mavlink.MAV_PARAM_TYPE_UINT8),
    ]

    set_params(params)


@falcon_test(pass_drone_status=True)
def test_getFrameDetails_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("get_frame_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the motor test section of the config page to access the frame details"
    }


@falcon_test(pass_drone_status=True)
def test_getFrameDetails_correctState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.motor_test"
    socketio_client.emit("get_frame_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "frame_type_config"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "frame_type": 0,
        "frame_class": 1,
    }


@falcon_test(pass_drone_status=True)
def test_getFrameDetails_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.motor_test"

    with NoDrone():
        socketio_client.emit("get_frame_config")
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"  # Correct name emitted
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to get frame config."
        }
