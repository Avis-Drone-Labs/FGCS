import time
import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import RecvMsgReturnsFalse, FakeTCP, SetAircraftType, ParamSetTimeout


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    from app import droneStatus

    droneStatus.drone.paramsController.getAllParams()
    time.sleep(1)
    while droneStatus.drone.paramsController.is_requesting_params:
        pass

    yield
    from . import socketio_client

    socketio_client.emit("set_current_flight_mode", {"newFlightMode": 0})
    socketio_client.get_received()[0]

    droneStatus.drone.flightModesController.setFlightMode(1, 7)


@falcon_test(pass_drone_status=True)
def test_getFlightModes_success(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.getFlightModes()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6
    for items in droneStatus.drone.flightModesController.flight_modes:
        assert items != "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModes_failure(client: SocketIOTestClient, droneStatus):
    with RecvMsgReturnsFalse():
        droneStatus.drone.flightModesController.getFlightModes()
        assert len(droneStatus.drone.flightModesController.flight_modes) == 6
        for items in droneStatus.drone.flightModesController.flight_modes:
            assert items == "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModeChannel_success(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.getFlightModeChannel()
    assert droneStatus.drone.flightModesController.flight_mode_channel != "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModeChannel_failure(client: SocketIOTestClient, droneStatus):
    with RecvMsgReturnsFalse():
        droneStatus.drone.flightModesController.getFlightModeChannel()
        assert droneStatus.drone.flightModesController.flight_mode_channel == "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_refreshdata(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.refreshData()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6


@falcon_test(pass_drone_status=True)
def test_setCurrentFlightMode(client: SocketIOTestClient, droneStatus):
    with FakeTCP():
        response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
        assert response.get("success") is False
        assert response.get("message") == "Could not set flight mode, serial exception"

    with RecvMsgReturnsFalse():
        response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
        assert response.get("success") is False
        assert response.get("message") == "Could not set flight mode"

    response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
    assert response.get("success") is True
    assert response.get("message") == "Flight mode set successfully"


@falcon_test(pass_drone_status=True)
def test_setFlightMode(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(0, 1)
    assert response.get("success") is False
    assert (
        response.get("message")
        == "Invalid flight mode number, must be between 1 and 6 inclusive, got 0."
    )

    response = droneStatus.drone.flightModesController.setFlightMode(-100, 1)
    assert response.get("success") is False
    assert (
        response.get("message")
        == "Invalid flight mode number, must be between 1 and 6 inclusive, got -100."
    )

    response = droneStatus.drone.flightModesController.setFlightMode(7, 1)
    assert response.get("success") is False
    assert (
        response.get("message")
        == "Invalid flight mode number, must be between 1 and 6 inclusive, got 7."
    )

    response = droneStatus.drone.flightModesController.setFlightMode(100, 1)
    assert response.get("success") is False
    assert (
        response.get("message")
        == "Invalid flight mode number, must be between 1 and 6 inclusive, got 100."
    )

    with SetAircraftType(1):
        response = droneStatus.drone.flightModesController.setFlightMode(1, -2)
        assert response.get("success") is False
        assert (
            response.get("message")
            == "Invalid plane flight mode, must be between 0 and 24 inclusive, got -2"
        )

        response = droneStatus.drone.flightModesController.setFlightMode(1, 25)
        assert response.get("success") is False
        assert (
            response.get("message")
            == "Invalid plane flight mode, must be between 0 and 24 inclusive, got 25"
        )

        with ParamSetTimeout():
            response = droneStatus.drone.flightModesController.setFlightMode(1, 1)
            assert response.get("success") is False
            assert (
                response.get("message")
                == "Failed to set flight mode 1 to PLANE_MODE_CIRCLE"
            )

        response = droneStatus.drone.flightModesController.setFlightMode(1, 24)
        assert response.get("success") is True
        assert response.get("message") == "Flight mode 1 set to PLANE_MODE_THERMAL"
        assert droneStatus.drone.flightModesController.flight_modes[0] == 24

    with SetAircraftType(2):
        response = droneStatus.drone.flightModesController.setFlightMode(1, -2)
        assert response.get("success") is False
        assert (
            response.get("message")
            == "Invalid copter flight mode, must be between 0 and 27 inclusive, got -2"
        )

        response = droneStatus.drone.flightModesController.setFlightMode(1, 28)
        assert response.get("success") is False
        assert (
            response.get("message")
            == "Invalid copter flight mode, must be between 0 and 27 inclusive, got 28"
        )

        with ParamSetTimeout():
            response = droneStatus.drone.flightModesController.setFlightMode(1, 1)
            assert response.get("success") is False
            assert (
                response.get("message")
                == "Failed to set flight mode 1 to COPTER_MODE_ACRO"
            )

        response = droneStatus.drone.flightModesController.setFlightMode(1, 27)
        assert response.get("success") is True
        assert response.get("message") == "Flight mode 1 set to COPTER_MODE_AUTO_RTL"
        assert droneStatus.drone.flightModesController.flight_modes[0] == 27
