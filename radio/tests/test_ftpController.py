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
