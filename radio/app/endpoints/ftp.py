from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import socketio
from app.utils import notConnectedError


class ListFilesType(TypedDict):
    path: str


@socketio.on("list_files")
def listFiles(data: ListFilesType) -> None:
    """
    List files in a directory on the drone's FTP server

    Args:
        data: The data from the client, this contains "path" which is the directory path to list files from
    """
    if not droneStatus.drone:
        return notConnectedError(action="list files")

    path = data.get("path", "/")

    result = droneStatus.drone.ftpController.listFiles(path)

    socketio.emit("list_files_result", result)
