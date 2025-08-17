import json
import os

import pytest
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone
from .mission_test_files.upload_mission_helper import uploadMission

MISSION_FILES_PATH = os.path.join(
    os.path.dirname(__file__),
    "mission_test_files",
)


@pytest.fixture()
def upload_default_mission():
    """
    Uploads the default mission, fence, and rally files to the drone before running a test.
    """
    # Setup
    import app.droneStatus as droneStatus

    assert droneStatus.drone is not None, "Drone must be connected before running tests"

    droneStatus.drone.is_listening = False

    uploadMission(
        os.path.join(MISSION_FILES_PATH, "default_mission.txt"),
        "mission",
        droneStatus.drone.master,
    )
    uploadMission(
        os.path.join(MISSION_FILES_PATH, "default_fence.txt"),
        "fence",
        droneStatus.drone.master,
    )
    uploadMission(
        os.path.join(MISSION_FILES_PATH, "default_rally.txt"),
        "rally",
        droneStatus.drone.master,
    )

    droneStatus.drone.is_listening = True

    yield  # this is where the testing happens

    # Teardown


@falcon_test(pass_drone_status=True)
def test_getCurrentMission_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("get_current_mission_all")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the dashboard or missions screen to get the current mission."
    }


@pytest.mark.usefixtures("upload_default_mission")
@falcon_test(pass_drone_status=True)
def test_getCurrentMission_correctState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "dashboard"
    socketio_client.emit("get_current_mission_all")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "current_mission_all"  # Correct name emitted

    with open(
        os.path.join(
            MISSION_FILES_PATH, "test_getCurrentMission_correctState_result.json"
        ),
        "r",
    ) as f:
        result_data = json.load(f)

    assert socketio_result["args"][0] == result_data


@falcon_test(pass_drone_status=True)
def test_getCurrentMission_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "dashboard"

    with NoDrone():
        socketio_client.emit("get_current_mission_all")
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"  # Correct name emitted
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to get current mission."
        }


@falcon_test(pass_drone_status=True)
def test_writeCurrentMission_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit("write_current_mission", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the missions screen to write the current mission."
    }


@falcon_test(pass_drone_status=True)
def test_writeCurrentMission_correctState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "missions"
    with open(
        os.path.join(
            MISSION_FILES_PATH, "test_writeCurrentMission_correctState_data.json"
        ),
        "r",
    ) as f:
        data = json.load(f)

    socketio_client.emit("write_current_mission", data)
    socketio_result = socketio_client.get_received()[-1]

    assert socketio_result["name"] == "write_mission_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Mission uploaded successfully",
    }


@falcon_test(pass_drone_status=True)
def test_writeCurrentMission_correctState_incorrectMissionType(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "missions"
    data = {
        "type": "unknown",
        "items": [],
    }

    socketio_client.emit("write_current_mission", data)
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "write_mission_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Invalid mission type. Must be 'mission', 'fence', or 'rally', got unknown.",
    }


@falcon_test(pass_drone_status=True)
def test_writeCurrentMission_correctState_noWaypoints(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "missions"
    data = {
        "type": "mission",
        "items": [],
    }

    socketio_client.emit("write_current_mission", data)
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "write_mission_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Cleared mission type 0, no waypoints to upload",
    }
