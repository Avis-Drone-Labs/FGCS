import time

import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import (
    FakeTCP,
    WaitForMessageReturnsNone,
)


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
def test_getFlightModeChannel_success(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.getFlightModeChannel()
    assert droneStatus.drone.flightModesController.flight_mode_channel != "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModes_success(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.getFlightModes()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6
    for items in droneStatus.drone.flightModesController.flight_modes:
        assert items != "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModes_failure(client: SocketIOTestClient, droneStatus):
    with WaitForMessageReturnsNone():
        droneStatus.drone.flightModesController.getFlightModes()
        assert len(droneStatus.drone.flightModesController.flight_modes) == 6
        for items in droneStatus.drone.flightModesController.flight_modes:
            assert items == "UNKNOWN"


@falcon_test(pass_drone_status=True)
def test_getFlightModeChannel_failure(client: SocketIOTestClient, droneStatus):
    with WaitForMessageReturnsNone():
        original_flight_mode_channel = (
            droneStatus.drone.flightModesController.flight_mode_channel
        )
        droneStatus.drone.flightModesController.flight_mode_channel = "UNKNOWN"
        droneStatus.drone.flightModesController.getFlightModeChannel()
        assert droneStatus.drone.flightModesController.flight_mode_channel == "UNKNOWN"
        droneStatus.drone.flightModesController.flight_mode_channel = (
            original_flight_mode_channel
        )


@falcon_test(pass_drone_status=True)
def test_refreshdata(client: SocketIOTestClient, droneStatus):
    droneStatus.drone.flightModesController.refreshData()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6


@falcon_test(pass_drone_status=True)
def test_setCurrentFlightMode(client: SocketIOTestClient, droneStatus):
    with FakeTCP():
        response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
        assert response == {
            "success": False,
            "message": "Could not set flight mode, serial exception",
        }

    with WaitForMessageReturnsNone():
        response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
        assert response == {
            "success": False,
            "message": "Could not set flight mode, command not accepted",
        }

    response = droneStatus.drone.flightModesController.setCurrentFlightMode(1)
    assert response == {
        "success": True,
        "message": "Flight mode set successfully",
    }


@falcon_test(pass_drone_status=True)
def test_setFlightMode_invalidData(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(0, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 0.",
    }

    response = droneStatus.drone.flightModesController.setFlightMode(-100, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got -100.",
    }

    response = droneStatus.drone.flightModesController.setFlightMode(7, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 7.",
    }

    response = droneStatus.drone.flightModesController.setFlightMode(100, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 100.",
    }


@pytest.mark.copter_only
@falcon_test(pass_drone_status=True)
def test_setFlightMode_invalidData_copter(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(1, -2)
    assert response == {
        "success": False,
        "message": "Invalid copter flight mode, must be between 0 and 27 inclusive, got -2",
    }

    response = droneStatus.drone.flightModesController.setFlightMode(1, 28)
    assert response == {
        "success": False,
        "message": "Invalid copter flight mode, must be between 0 and 27 inclusive, got 28",
    }

    with WaitForMessageReturnsNone():
        response = droneStatus.drone.flightModesController.setFlightMode(1, 1)
        assert response == {
            "success": False,
            "message": "Failed to set flight mode 1 to COPTER_MODE_ACRO",
        }


@pytest.mark.copter_only
@falcon_test(pass_drone_status=True)
def test_setFlightMode_success_copter(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(1, 5)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to COPTER_MODE_LOITER",
    }
    assert droneStatus.drone.flightModesController.flight_modes[0] == 5


@pytest.mark.plane_only
@falcon_test(pass_drone_status=True)
def test_setFlightMode_invalidData_plane(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(1, -2)
    assert response == {
        "success": False,
        "message": "Invalid plane flight mode, must be between 0 and 24 inclusive, got -2",
    }

    response = droneStatus.drone.flightModesController.setFlightMode(1, 25)
    assert response == {
        "success": False,
        "message": "Invalid plane flight mode, must be between 0 and 24 inclusive, got 25",
    }

    with WaitForMessageReturnsNone():
        response = droneStatus.drone.flightModesController.setFlightMode(1, 1)
        assert response == {
            "success": False,
            "message": "Failed to set flight mode 1 to PLANE_MODE_CIRCLE",
        }


@pytest.mark.plane_only
@falcon_test(pass_drone_status=True)
def test_setFlightMode_success_plane(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(1, 5)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to PLANE_MODE_FLY_BY_WIRE_A",
    }
    assert droneStatus.drone.flightModesController.flight_modes[0] == 5


@falcon_test(pass_drone_status=True)
def test_setFlightModeChannel_invalidData(client: SocketIOTestClient, droneStatus):
    response = droneStatus.drone.flightModesController.setFlightModeChannel(0)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 0.",
    }

    response = droneStatus.drone.flightModesController.setFlightModeChannel(-1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got -1.",
    }

    response = droneStatus.drone.flightModesController.setFlightModeChannel(17)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 17.",
    }

    response = droneStatus.drone.flightModesController.setFlightModeChannel(100)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 100.",
    }
