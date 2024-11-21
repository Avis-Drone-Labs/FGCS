import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import ParamSetTimeout, ParamRefreshTimeout
from typing import List, Any, Optional, Union


def send_and_receive_params(
    client: SocketIOTestClient, endpoint: str, args: Optional[Union[List[Any], str]] = None
) -> dict:
    """
    Sends a request to the socketio test client and awaits a response, returning the entire response (name and args)

    Args:
        client: The socketio test client
        endpoint(str): The endpoint to send the request to
        args(dict | None | str): The arguments to pass to the endpoint

    Returns:
         The data received from the client (name and arguments of the socket.emit)
    """
    client.emit(endpoint, args) if args is not None else client.emit(endpoint)
    return client.get_received()[0]


def assert_test_params(data: dict, message: dict, name: str) -> None:
    """
    Take the data from socketio test client and assert that it matches the asserted values

    Args:
        data (dict): The data received from the .get_received()
        message (dict): The expected message
        name (str): The name of the socket.emit
    """
    assert data["name"] == name
    assert data["args"][0] == message


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "dashboard"
    socketio_result = send_and_receive_params(
        socketio_client, "set_multiple_params", []
    )

    assert_test_params(
        socketio_result,
        {"message": "You must be on the params screen to save parameters."},
        "params_error",
    )


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_missingData(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "params"
    socketio_result = send_and_receive_params(
        socketio_client, "set_multiple_params", []
    )

    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_invalidData(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    # Invalid Param Type
    droneStatus.state = "params"
    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "RC_11MAX", "param_value": 1950, "param_type": 11}],
    )

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {"message": "Failed to save parameters."}

    # Param Value too big to fit into param_type data type structure
    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 256, "param_type": 1}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 128, "param_type": 2}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 65536, "param_type": 3}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 32770, "param_type": 4}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 4294967296, "param_type": 5}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 2147483648, "param_type": 6}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    # Param Value too small to fit into param_type data type structure
    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -1, "param_type": 1}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -129, "param_type": 2}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -1, "param_type": 3}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -32770, "param_type": 4}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -1, "param_type": 5}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )

    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": -2147483686, "param_type": 6}],
    )
    assert_test_params(
        socketio_result, {"message": "Failed to save parameters."}, "params_error"
    )


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_paramSetTimeout(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "params"
    with ParamSetTimeout():
        socketio_result = send_and_receive_params(
            socketio_client,
            "set_multiple_params",
            [{"param_id": "ACRO_BAL_ROLL", "param_value": 2, "param_type": 9}],
        )
        assert_test_params(
            socketio_result, {"message": "Failed to save parameters."}, "params_error"
        )


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_successfullySet_paramsState(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "params"
    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 2, "param_type": 9}],
    )

    assert_test_params(
        socketio_result,
        {"message": "Parameters saved successfully."},
        "param_set_success",
    )


@falcon_test(pass_drone_status=True)
def test_setMultipleParams_successfullySet_configState(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "config"
    socketio_result = send_and_receive_params(
        socketio_client,
        "set_multiple_params",
        [{"param_id": "ACRO_BAL_ROLL", "param_value": 2, "param_type": 9}],
    )

    assert_test_params(
        socketio_result,
        {"message": "Parameters saved successfully."},
        "param_set_success",
    )


@falcon_test(pass_drone_status=True)
def test_refreshParams_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "dashboard"
    socketio_result = send_and_receive_params(socketio_client, "refresh_params")
    assert_test_params(
        socketio_result,
        {"message": "You must be on the params screen to refresh the parameters."},
        "params_error",
    )


@falcon_test(pass_drone_status=True)
def test_refreshParams_timeout(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "params"
    with ParamRefreshTimeout():
        socketio_result = send_and_receive_params(socketio_client, "refresh_params")
        assert (
            socketio_result["name"] == "params_error"
            or socketio_result["name"] == "params"
        )
        if socketio_result["name"] == "params_error":
            assert socketio_result["args"][0] == {
                "message": "Parameter request timed out after 3 minutes."
            }

        if socketio_result["name"] == "params":
            assert (
                socketio_result["args"][0] == droneStatus.drone.paramsController.params
            )


@falcon_test(pass_drone_status=True)
def test_refreshParams_successfullyRefreshed(
    socketio_client: SocketIOTestClient, droneStatus
) -> None:
    droneStatus.state = "params"
    socketio_result = send_and_receive_params(socketio_client, "refresh_params")
    assert (
        socketio_result["name"] == "param_request_update"
        or socketio_result["name"] == "params"
    )

    pytest.skip(reason="Flaky test, needs fixing in alpha 0.1.8")
    if socketio_result["name"] == "param_request_update":
        assert len(socketio_result["args"][0]) == 2
        assert socketio_result["args"][0]["total_number_of_params"] == 1400
        assert socketio_result["args"][0]["current_param_index"] <= 1400

    if socketio_result["name"] == "params":
        assert socketio_result["args"][0] == droneStatus.drone.paramsController.params
