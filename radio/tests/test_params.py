from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "dashboard"
    socketio_client.emit("set_multiple_params", [])
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the params screen to save parameters."
    }


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_missingData(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit("set_multiple_params", [])
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {"message": "Failed to save parameters."}


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_wrongParamType(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit(
        "set_multiple_params",
        [{"param_id": "RC_11MAX", "param_value": 1950, "param_type": 11}],
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {"message": "Failed to save parameters."}


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_sucessfullySet_paramsState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit(
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 2, "param_type": 9}],
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "param_set_success"
    assert socketio_result["args"][0] == {"message": "Parameters saved successfully."}


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_sucessfullySet_configState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"
    socketio_client.emit(
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 2, "param_type": 9}],
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "param_set_success"
    assert socketio_result["args"][0] == {"message": "Parameters saved successfully."}
