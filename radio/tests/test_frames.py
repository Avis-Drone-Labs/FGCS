from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test


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
