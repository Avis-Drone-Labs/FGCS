from typing import List

from flask_socketio.test_client import SocketIOTestClient
from pymavlink import mavftp

from . import falcon_test


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_success(
    client: SocketIOTestClient, droneStatus
):
    entries: List[mavftp.DirectoryEntry] = [
        mavftp.DirectoryEntry(name=".", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="..", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="file1.txt", is_dir=False, size_b=1234),
        mavftp.DirectoryEntry(name="folder1", is_dir=True, size_b=0),
    ]

    result = droneStatus.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/"
    )

    assert result == [
        {"name": ".", "path": "/", "is_dir": True, "size_b": 0},
        {"name": "..", "path": "/", "is_dir": True, "size_b": 0},
        {"name": "file1.txt", "path": "/file1.txt", "is_dir": False, "size_b": 1234},
        {"name": "folder1", "path": "/folder1", "is_dir": True, "size_b": 0},
    ]


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_subPathSuccess(
    client: SocketIOTestClient, droneStatus
):
    entries: List[mavftp.DirectoryEntry] = [
        mavftp.DirectoryEntry(name=".", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="..", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="file1.txt", is_dir=False, size_b=1234),
        mavftp.DirectoryEntry(name="folder1", is_dir=True, size_b=0),
    ]

    result = droneStatus.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/test/path"
    )

    assert result == [
        {"name": ".", "path": "/test/path", "is_dir": True, "size_b": 0},
        {"name": "..", "path": "/test", "is_dir": True, "size_b": 0},
        {
            "name": "file1.txt",
            "path": "/test/path/file1.txt",
            "is_dir": False,
            "size_b": 1234,
        },
        {"name": "folder1", "path": "/test/path/folder1", "is_dir": True, "size_b": 0},
    ]


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_emptyEntriesNoPath_success(
    client: SocketIOTestClient, droneStatus
):
    entries: List[mavftp.DirectoryEntry] = []

    result = droneStatus.drone.ftpController._convertDirectoryEntriesToDicts(entries)

    assert result == []


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_emptyEntries_success(
    client: SocketIOTestClient, droneStatus
):
    entries: List[mavftp.DirectoryEntry] = []

    result = droneStatus.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/"
    )

    assert result == []


@falcon_test(pass_drone_status=True)
def test_listFiles_blockedByCurrentOp(client: SocketIOTestClient, droneStatus):
    """Test that listFiles is blocked when another operation is in progress"""
    droneStatus.drone.ftpController.current_op = "read_file"

    result = droneStatus.drone.ftpController.listFiles("/")

    assert result == {
        "success": False,
        "message": "FTP operation already in progress: read_file",
    }

    droneStatus.drone.ftpController.current_op = None


@falcon_test(pass_drone_status=True)
def test_readFile_blockedByCurrentOp(client: SocketIOTestClient, droneStatus):
    """Test that readFile is blocked when another operation is in progress"""
    droneStatus.drone.ftpController.current_op = "list_files"

    result = droneStatus.drone.ftpController.readFile("/test.txt")

    assert result == {
        "success": False,
        "message": "FTP operation already in progress: list_files",
    }

    droneStatus.drone.ftpController.current_op = None


@falcon_test(pass_drone_status=True)
def test_currentOp_clearedOnListFilesError(client: SocketIOTestClient, droneStatus):
    """Test that current_op is cleared even when listFiles fails"""
    assert droneStatus.drone.ftpController.current_op is None

    result = droneStatus.drone.ftpController.listFiles("")

    assert result == {"success": False, "message": "Path cannot be empty"}
    # Verify current_op is still None after error
    assert droneStatus.drone.ftpController.current_op is None


@falcon_test(pass_drone_status=True)
def test_currentOp_clearedOnReadFileError(client: SocketIOTestClient, droneStatus):
    """Test that current_op is cleared even when readFile fails"""
    assert droneStatus.drone.ftpController.current_op is None

    result = droneStatus.drone.ftpController.readFile("")

    assert result == {"success": False, "message": "File path cannot be empty"}

    # Verify current_op is still None after error
    assert droneStatus.drone.ftpController.current_op is None


@falcon_test(pass_drone_status=True)
def test_multipleOperations_sequential(client: SocketIOTestClient, droneStatus):
    """Test that operations can run sequentially after previous one completes"""
    # Verify current_op is None initially
    assert droneStatus.drone.ftpController.current_op is None

    # First operation with empty path (will fail but clear current_op)
    result1 = droneStatus.drone.ftpController.listFiles("")
    assert result1 == {"success": False, "message": "Path cannot be empty"}
    assert droneStatus.drone.ftpController.current_op is None

    # Second operation should be allowed since first is complete
    result2 = droneStatus.drone.ftpController.readFile("")
    assert result2 == {"success": False, "message": "File path cannot be empty"}
    assert droneStatus.drone.ftpController.current_op is None

    # Third operation should also be allowed
    result3 = droneStatus.drone.ftpController.listFiles("")
    assert result3 == {"success": False, "message": "Path cannot be empty"}
    assert droneStatus.drone.ftpController.current_op is None
