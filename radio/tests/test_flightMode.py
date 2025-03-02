import time
import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    """
    Sets the flight mode back to default after testing to ensure arm tests do not fail
    """
    from app import droneStatus

    droneStatus.drone.paramsController.getAllParams()
    time.sleep(1)
    while droneStatus.drone.paramsController.is_requesting_params:
        pass

    yield
    from . import socketio_client

    socketio_client.emit("set_current_flight_mode", {"newFlightMode": 0})
    socketio_client.get_received()[0]


@falcon_test(pass_drone_status=True)
def test_getFlightModeConfig_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit("get_flight_mode_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access the flight modes."
    }


@falcon_test(pass_drone_status=True)
def test_getFlightModeConfig_correctState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("get_flight_mode_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "flight_mode_config"
    assert socketio_result["args"][0] == {
        "flight_modes": [7, 9, 6, 3, 5, 0],
        "flight_mode_channel": 5,
    }


@falcon_test(pass_drone_status=True)
def test_setFlightModeConfig_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit("set_flight_mode", {"mode_number": 1, "flight_mode": 7})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access the flight modes."
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_missingFlightMode(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_flight_mode", {"mode_number": 1})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "drone_error"
    assert socketio_result["args"][0] == {
        "message": "Mode number and flight mode must be specified.",
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_missingModeNumber(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_flight_mode", {"flight_mode": 1})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "drone_error"
    assert socketio_result["args"][0] == {
        "message": "Mode number and flight mode must be specified.",
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_missingData(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_flight_mode", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "drone_error"
    assert socketio_result["args"][0] == {
        "message": "Mode number and flight mode must be specified.",
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_wrongModeNumber(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_flight_mode", {"mode_number": 0, "flight_mode": 9})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "set_flight_mode_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 0.",
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_successfullySet(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_flight_mode", {"mode_number": 1, "flight_mode": 7})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "set_flight_mode_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Flight mode 1 set to COPTER_MODE_CIRCLE",
    }
    assert droneStatus.drone.flightModesController.flight_modes == [7, 9, 6, 3, 5, 0]


@falcon_test(pass_drone_status=True)
def test_refreshFlightModeData_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit("refresh_flight_mode_data")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access the flight modes."
    }


@falcon_test(pass_drone_status=True)
def test_refreshFlightModeData_success(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("refresh_flight_mode_data")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "flight_mode_config"


@falcon_test(pass_drone_status=True)
def test_setCurrentFlightMode_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.flight_modes"
    socketio_client.emit("set_current_flight_mode", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the dashboard screen to set the current flight mode."
    }


@falcon_test(pass_drone_status=True)
def test_setCurrentFlightMode_missingData(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "dashboard"
    socketio_client.emit("set_current_flight_mode", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "drone_error"
    assert socketio_result["args"][0] == {"message": "Flight mode must be specified."}


@falcon_test(pass_drone_status=True)
def test_setCurrentFlightMode_successfullySet(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "dashboard"
    socketio_client.emit("set_current_flight_mode", {"newFlightMode": 7})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "set_current_flight_mode_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Flight mode set successfully",
    }


@falcon_test(pass_drone_status=True)
def test_flightModeEndpoints_noDrone(socketio_client: SocketIOTestClient, droneStatus):
    with NoDrone():
        # Test get flight mode config
        droneStatus.state = "config.flight_modes"
        socketio_client.emit("get_flight_mode_config")
        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert (
            result["args"][0]["message"]
            == "Must be connected to the drone to get the flight mode config."
        )

        # Test set flight mode
        socketio_client.emit("set_flight_mode", {"mode_number": 1, "flight_mode": 4})
        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert (
            result["args"][0]["message"]
            == "Must be connected to the drone to set the flight mode."
        )

        # Test refresh flight mode
        socketio_client.emit("refresh_flight_mode_data")
        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert (
            result["args"][0]["message"]
            == "Must be connected to the drone to refresh the flight mode data."
        )

        # Test refresh flight mode
        droneStatus.state = "dashboard"
        socketio_client.emit("set_current_flight_mode", {"newFlightMode": 1})
        result = socketio_client.get_received()[0]
        assert result["name"] == "connection_error"
        assert (
            result["args"][0]["message"]
            == "Must be connected to the drone to set the current flight mode."
        )
