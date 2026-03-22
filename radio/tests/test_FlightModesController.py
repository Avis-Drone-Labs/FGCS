import time

import pytest
from pymavlink.mavutil import mavlink

from .helpers import (
    FakeTCP,
    WaitForMessageReturnsNone,
)

FLIGHT_MODE_SET_RETRY_MAX_ATTEMPTS = 5
FLIGHT_MODE_SET_RETRY_DELAY_SECS = 1


def set_flight_mode_with_retries(
    droneStatus, mode_number: int, flight_mode: int
) -> dict:
    """Retry setting a flight mode to reduce intermittent SITL timing flakes."""
    last_response = {"success": False, "message": "No response"}
    for _ in range(FLIGHT_MODE_SET_RETRY_MAX_ATTEMPTS):
        last_response = droneStatus.drone.flightModesController.setFlightMode(
            mode_number, flight_mode
        )
        if last_response.get("success"):
            return last_response

        time.sleep(FLIGHT_MODE_SET_RETRY_DELAY_SECS)

    return last_response


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests():
    from app import droneStatus

    # Prime controller cache for cache-only reads.
    params_controller = droneStatus.drone.paramsController
    params_controller.saveParam("FLTMODE_CH", 6, mavlink.MAV_PARAM_TYPE_UINT8)
    for idx in range(1, 7):
        params_controller.saveParam(f"FLTMODE{idx}", 0, mavlink.MAV_PARAM_TYPE_UINT8)

    yield
    from . import socketio_client

    socketio_client.emit("set_current_flight_mode", {"newFlightMode": 0})
    socketio_client.get_received()[0]

    droneStatus.drone.flightModesController.setFlightMode(1, 7)


def test_getFlightModeChannel_success(droneStatus):
    droneStatus.drone.flightModesController.getFlightModeChannel()
    assert droneStatus.drone.flightModesController.flight_mode_channel != "UNKNOWN"


def test_getFlightModes_success(droneStatus):
    droneStatus.drone.flightModesController.getFlightModes()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6
    for items in droneStatus.drone.flightModesController.flight_modes:
        assert items != "UNKNOWN"


def test_getFlightModes_failure(droneStatus):
    params_controller = droneStatus.drone.paramsController
    original_params = params_controller.params.copy()
    params_controller.params = [
        p
        for p in original_params
        if not str(p.get("param_id", "")).startswith("FLTMODE")
    ]

    try:
        droneStatus.drone.flightModesController.getFlightModes()
        assert len(droneStatus.drone.flightModesController.flight_modes) == 6
        for items in droneStatus.drone.flightModesController.flight_modes:
            assert items == "UNKNOWN"
    finally:
        params_controller.params = original_params


def test_getFlightModeChannel_failure(droneStatus):
    params_controller = droneStatus.drone.paramsController
    original_params = params_controller.params.copy()
    original_flight_mode_channel = (
        droneStatus.drone.flightModesController.flight_mode_channel
    )
    droneStatus.drone.flightModesController.flight_mode_channel = "UNKNOWN"

    params_controller.params = [
        p for p in original_params if p.get("param_id") != "FLTMODE_CH"
    ]

    try:
        droneStatus.drone.flightModesController.getFlightModeChannel()
        assert droneStatus.drone.flightModesController.flight_mode_channel == "UNKNOWN"
    finally:
        params_controller.params = original_params
        droneStatus.drone.flightModesController.flight_mode_channel = (
            original_flight_mode_channel
        )


def test_refreshdata(droneStatus):
    droneStatus.drone.flightModesController.refreshData()
    assert len(droneStatus.drone.flightModesController.flight_modes) == 6


def test_setCurrentFlightMode(droneStatus):
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


def test_setFlightMode_invalidData(droneStatus):
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
def test_setFlightMode_invalidData_copter(droneStatus):
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
def test_setFlightMode_success_copter(droneStatus):
    response = set_flight_mode_with_retries(droneStatus, 1, 2)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to COPTER_MODE_ALT_HOLD",
    }
    assert droneStatus.drone.flightModesController.flight_modes[0] == 2


@pytest.mark.plane_only
def test_setFlightMode_invalidData_plane(droneStatus):
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
def test_setFlightMode_success_plane(droneStatus):
    response = droneStatus.drone.flightModesController.setFlightMode(1, 5)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to PLANE_MODE_FLY_BY_WIRE_A",
    }
    assert droneStatus.drone.flightModesController.flight_modes[0] == 5


def test_setFlightModeChannel_invalidData(droneStatus):
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
