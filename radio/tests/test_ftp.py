from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone


@falcon_test(pass_drone_status=True)
def test_listFiles_wrongState_failure(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "dashboard"
    socketio_client.emit("list_files", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access FTP operations"
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_noPath_success(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("list_files", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "list_files_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Directory listing retrieved successfully",
        "data": [
            {"name": ".", "path": "/", "is_dir": True, "size_b": 0},
            {"name": "..", "path": "/", "is_dir": True, "size_b": 0},
            {"name": "@ROMFS", "path": "/@ROMFS", "is_dir": True, "size_b": 0},
            {"name": "@SYS", "path": "/@SYS", "is_dir": True, "size_b": 0},
            {"name": "logs", "path": "/logs", "is_dir": True, "size_b": 0},
            {"name": "terrain", "path": "/terrain", "is_dir": True, "size_b": 0},
        ],
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_emptyPath_failure(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("list_files", {"path": ""})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "list_files_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Path cannot be empty",
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_homePath_success(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("list_files", {"path": "/"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "list_files_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Directory listing retrieved successfully",
        "data": [
            {"name": ".", "path": "/", "is_dir": True, "size_b": 0},
            {"name": "..", "path": "/", "is_dir": True, "size_b": 0},
            {"name": "@ROMFS", "path": "/@ROMFS", "is_dir": True, "size_b": 0},
            {"name": "@SYS", "path": "/@SYS", "is_dir": True, "size_b": 0},
            {"name": "logs", "path": "/logs", "is_dir": True, "size_b": 0},
            {"name": "terrain", "path": "/terrain", "is_dir": True, "size_b": 0},
        ],
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_subPath_success(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("list_files", {"path": "/terrain"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "list_files_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Directory listing retrieved successfully",
        "data": [
            {
                "is_dir": True,
                "name": ".",
                "path": "/terrain",
                "size_b": 0,
            },
            {
                "is_dir": True,
                "name": "..",
                "path": "/",
                "size_b": 0,
            },
            {
                "is_dir": False,
                "name": "N52W001.DAT",
                "path": "/terrain/N52W001.DAT",
                "size_b": 0,
            },
        ],
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_unknownPath_failure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"
    socketio_client.emit("list_files", {"path": "/random/path/that/does/not/exist"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "list_files_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Timeout reached while waiting for FTP responses for operation list_files",
    }


@falcon_test(pass_drone_status=True)
def test_listFiles_noDroneConnection_failure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"

    with NoDrone():
        socketio_client.emit("list_files", {})
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to list files."
        }
