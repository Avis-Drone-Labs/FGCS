from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone


@falcon_test(pass_drone_status=True)
def test_getCurrentMission_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("get_current_mission_all")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the dashboard or missions screen to get the current mission."
    }


@falcon_test(pass_drone_status=True)
def test_getCurrentMission_correctState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "dashboard"
    socketio_client.emit("get_current_mission_all")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "current_mission_all"  # Correct name emitted

    # pytest.skip(reason="Sending mission to simulator is currently bugged and fails sometimes")
    assert socketio_result["args"][0] == {
        "mission_items": [
            {
                "autocontinue": 1,
                "command": 16,
                "current": 0,
                "frame": 0,
                "mavpackettype": "MISSION_ITEM_INT",
                "mission_type": 0,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "seq": 0,
                "target_component": 0,
                "target_system": 255,
                "x": 527805690,
                "y": -7079236,
                "z": 0.09999999403953552,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 1,
                "frame": 3,
                "command": 22,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 0,
                "y": 0,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 2,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527803200,
                "y": -7097929,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 3,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527812256,
                "y": -7098949,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 4,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527816992,
                "y": -7079530,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 5,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527814400,
                "y": -7057160,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 6,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527807968,
                "y": -7065958,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 7,
                "frame": 3,
                "command": 21,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 1.0,
                "x": 527804416,
                "y": -7081997,
                "z": 0.0,
                "mission_type": 0,
            },
        ],
        "fence_items": [],
        "rally_items": [],
    }


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
    data = {
        "type": "mission",
        "items": [
            {
                "autocontinue": 1,
                "command": 16,
                "current": 0,
                "frame": 0,
                "mavpackettype": "MISSION_ITEM_INT",
                "mission_type": 0,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "seq": 0,
                "target_component": 0,
                "target_system": 255,
                "x": 527805690,
                "y": -7079236,
                "z": 0.09999999403953552,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 1,
                "frame": 3,
                "command": 22,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 0,
                "y": 0,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 2,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527803200,
                "y": -7097929,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 3,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527812256,
                "y": -7098949,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 4,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527816992,
                "y": -7079530,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 5,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527814400,
                "y": -7057160,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 6,
                "frame": 3,
                "command": 16,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 0.0,
                "x": 527807968,
                "y": -7065958,
                "z": 30.0,
                "mission_type": 0,
            },
            {
                "mavpackettype": "MISSION_ITEM_INT",
                "target_system": 255,
                "target_component": 0,
                "seq": 7,
                "frame": 3,
                "command": 21,
                "current": 0,
                "autocontinue": 1,
                "param1": 0.0,
                "param2": 0.0,
                "param3": 0.0,
                "param4": 1.0,
                "x": 527804416,
                "y": -7081997,
                "z": 0.0,
                "mission_type": 0,
            },
        ],
    }

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
