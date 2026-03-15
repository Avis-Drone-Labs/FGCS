import time

import pytest

from .helpers import (
    FakeTCP,
    WaitForMessageReturnsNone,
)


@pytest.fixture(scope="module", autouse=True)
def run_once_after_all_tests(socketio_client, drone_status):
    drone_status.drone.paramsController.getAllParams()
    time.sleep(1)
    while drone_status.drone.paramsController.is_requesting_params:
        pass

    yield

    socketio_client.emit("set_current_flight_mode", {"newFlightMode": 0})
    socketio_client.get_received()[0]

    drone_status.drone.flightModesController.setFlightMode(1, 7)


def test_getFlightModeChannel_success(drone_status):
    drone_status.drone.flightModesController.getFlightModeChannel()
    assert drone_status.drone.flightModesController.flight_mode_channel != "UNKNOWN"


def test_getFlightModes_success(drone_status):
    drone_status.drone.flightModesController.getFlightModes()
    assert len(drone_status.drone.flightModesController.flight_modes) == 6
    for items in drone_status.drone.flightModesController.flight_modes:
        assert items != "UNKNOWN"


def test_getFlightModes_failure(drone_status):
    with WaitForMessageReturnsNone(drone_status):
        drone_status.drone.flightModesController.getFlightModes()
        assert len(drone_status.drone.flightModesController.flight_modes) == 6
        for items in drone_status.drone.flightModesController.flight_modes:
            assert items == "UNKNOWN"


def test_getFlightModeChannel_failure(drone_status):
    with WaitForMessageReturnsNone(drone_status):
        original_flight_mode_channel = (
            drone_status.drone.flightModesController.flight_mode_channel
        )
        drone_status.drone.flightModesController.flight_mode_channel = "UNKNOWN"
        drone_status.drone.flightModesController.getFlightModeChannel()
        assert drone_status.drone.flightModesController.flight_mode_channel == "UNKNOWN"
        drone_status.drone.flightModesController.flight_mode_channel = (
            original_flight_mode_channel
        )


def test_refreshdata(drone_status):
    drone_status.drone.flightModesController.refreshData()
    assert len(drone_status.drone.flightModesController.flight_modes) == 6


def test_setCurrentFlightMode(drone_status):
    with FakeTCP(drone_status):
        response = drone_status.drone.flightModesController.setCurrentFlightMode(1)
        assert response == {
            "success": False,
            "message": "Could not set flight mode, serial exception",
        }

    with WaitForMessageReturnsNone(drone_status):
        response = drone_status.drone.flightModesController.setCurrentFlightMode(1)
        assert response == {
            "success": False,
            "message": "Could not set flight mode, command not accepted",
        }

    response = drone_status.drone.flightModesController.setCurrentFlightMode(1)
    assert response == {
        "success": True,
        "message": "Flight mode set successfully",
    }


def test_setFlightMode_invalidData(drone_status):
    response = drone_status.drone.flightModesController.setFlightMode(0, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 0.",
    }

    response = drone_status.drone.flightModesController.setFlightMode(-100, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got -100.",
    }

    response = drone_status.drone.flightModesController.setFlightMode(7, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 7.",
    }

    response = drone_status.drone.flightModesController.setFlightMode(100, 1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode number, must be between 1 and 6 inclusive, got 100.",
    }


@pytest.mark.copter_only
def test_setFlightMode_invalidData_copter(drone_status):
    response = drone_status.drone.flightModesController.setFlightMode(1, -2)
    assert response == {
        "success": False,
        "message": "Invalid copter flight mode, must be between 0 and 27 inclusive, got -2",
    }

    response = drone_status.drone.flightModesController.setFlightMode(1, 28)
    assert response == {
        "success": False,
        "message": "Invalid copter flight mode, must be between 0 and 27 inclusive, got 28",
    }

    with WaitForMessageReturnsNone(drone_status):
        response = drone_status.drone.flightModesController.setFlightMode(1, 1)
        assert response == {
            "success": False,
            "message": "Failed to set flight mode 1 to COPTER_MODE_ACRO",
        }


@pytest.mark.copter_only
def test_setFlightMode_success_copter(drone_status):
    response = drone_status.drone.flightModesController.setFlightMode(1, 5)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to COPTER_MODE_LOITER",
    }
    assert drone_status.drone.flightModesController.flight_modes[0] == 5


@pytest.mark.plane_only
def test_setFlightMode_invalidData_plane(drone_status):
    response = drone_status.drone.flightModesController.setFlightMode(1, -2)
    assert response == {
        "success": False,
        "message": "Invalid plane flight mode, must be between 0 and 24 inclusive, got -2",
    }

    response = drone_status.drone.flightModesController.setFlightMode(1, 25)
    assert response == {
        "success": False,
        "message": "Invalid plane flight mode, must be between 0 and 24 inclusive, got 25",
    }

    with WaitForMessageReturnsNone(drone_status):
        response = drone_status.drone.flightModesController.setFlightMode(1, 1)
        assert response == {
            "success": False,
            "message": "Failed to set flight mode 1 to PLANE_MODE_CIRCLE",
        }


@pytest.mark.plane_only
def test_setFlightMode_success_plane(drone_status):
    response = drone_status.drone.flightModesController.setFlightMode(1, 5)
    assert response == {
        "success": True,
        "message": "Flight mode 1 set to PLANE_MODE_FLY_BY_WIRE_A",
    }
    assert drone_status.drone.flightModesController.flight_modes[0] == 5


def test_setFlightModeChannel_invalidData(drone_status):
    response = drone_status.drone.flightModesController.setFlightModeChannel(0)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 0.",
    }

    response = drone_status.drone.flightModesController.setFlightModeChannel(-1)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got -1.",
    }

    response = drone_status.drone.flightModesController.setFlightModeChannel(17)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 17.",
    }

    response = drone_status.drone.flightModesController.setFlightModeChannel(100)
    assert response == {
        "success": False,
        "message": "Invalid flight mode channel, must be between 1 and 16 inclusive, got 100.",
    }
