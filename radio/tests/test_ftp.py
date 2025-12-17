import os

from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import NoDrone

FTP_FILES_PATH = os.path.join(
    os.path.dirname(__file__),
    "ftp_test_files",
)


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


@falcon_test(pass_drone_status=True)
def test_readFile_wrongState_failure(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "dashboard"
    socketio_client.emit("read_file", {"path": "/@ROMFS/locations.txt"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access FTP operations"
    }


@falcon_test(pass_drone_status=True)
def test_readFile_missingPath_failure(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("read_file", {})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "read_file_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Missing file path",
    }


@falcon_test(pass_drone_status=True)
def test_readFile_emptyPath_failure(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("read_file", {"path": ""})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "read_file_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "File path cannot be empty",
    }


@falcon_test(pass_drone_status=True)
def test_readFile_validFile_success(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config"
    socketio_client.emit("read_file", {"path": "/@ROMFS/locations.txt"})
    socketio_result = socketio_client.get_received()[0]

    expected_file_path = os.path.join(FTP_FILES_PATH, "expected_locations.txt")
    with open(expected_file_path, "rb") as f:
        expected_content = f.read()

    assert socketio_result["name"] == "read_file_result"
    assert socketio_result["args"][0]["success"] is True
    assert socketio_result["args"][0]["message"] == "File read successfully"
    assert socketio_result["args"][0]["data"]["file_data"] == list(expected_content)
    assert socketio_result["args"][0]["data"]["file_name"] == "locations.txt"


@falcon_test(pass_drone_status=True)
def test_readFile_nonExistentFile_failure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"
    socketio_client.emit("read_file", {"path": "/random/file/that/does/not/exist.txt"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "read_file_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Failed to open file for reading",
    }


@falcon_test(pass_drone_status=True)
def test_readFile_directoryPath_failure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"
    socketio_client.emit("read_file", {"path": "/@ROMFS"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "read_file_result"
    assert socketio_result["args"][0] == {
        "success": False,
        "message": "Failed to open file for reading",
    }


@falcon_test(pass_drone_status=True)
def test_readFile_noDroneConnection_failure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config"

    with NoDrone():
        socketio_client.emit("read_file", {"path": "/@ROMFS/locations.txt"})
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to read file."
        }
