from flask_socketio.test_client import SocketIOTestClient
from pymavlink import mavftp

from . import falcon_test


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_success(
    client: SocketIOTestClient, droneStatus
):
    entries = [
        mavftp.DirectoryEntry(name="file1.txt", is_dir=False, size_b=1234),
        mavftp.DirectoryEntry(name="folder1", is_dir=True, size_b=0),
    ]

    result = droneStatus.drone.ftpController.convertDirectoryEntriesToDicts(
        entries, "/"
    )

    assert result == [
        {"name": "file1.txt", "path": "/file1.txt", "is_dir": False, "size_b": 1234},
        {"name": "folder1", "path": "/folder1", "is_dir": True, "size_b": 0},
    ]


@falcon_test(pass_drone_status=True)
def test_convertDirectoryEntriesToDicts_empty(client: SocketIOTestClient, droneStatus):
    entries = []

    result = droneStatus.drone.ftpController.convertDirectoryEntriesToDicts(entries)

    assert result == []
