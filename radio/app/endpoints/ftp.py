from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError


class ListFilesType(TypedDict):
    path: str


class ReadFileType(TypedDict):
    path: str


@socketio.on("list_files")
def listFiles(data: ListFilesType) -> None:
    """
    List files in a directory on the drone's FTP server

    Args:
        data: The data from the client, this contains "path" which is the directory path to list files from
    """
    if droneStatus.state is None or "config" not in droneStatus.state:
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access FTP operations"},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="list files")

    path = data.get("path", "/")

    result = droneStatus.drone.ftpController.listFiles(path)

    socketio.emit("list_files_result", result)


@socketio.on("read_file")
def readFile(data: ReadFileType) -> None:
    """
    Read/download a file from the drone's FTP server

    Args:
        data: The data from the client, this contains "path" which is the file path to read/download
    """
    if droneStatus.state is None or "config" not in droneStatus.state:
        socketio.emit(
            "params_error",
            {"message": "You must be on the config screen to access FTP operations"},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return notConnectedError(action="read file")

    path = data.get("path", None)
    if path is None:
        socketio.emit(
            "read_file_result", {"success": False, "message": "Missing file path"}
        )
        return

    def progress_callback(bytes_downloaded, total_bytes, percentage):
        socketio.emit(
            "read_file_progress",
            {
                "bytes_downloaded": bytes_downloaded,
                "total_bytes": total_bytes,
                "percentage": round(percentage, 1),
            },
        )

    result = droneStatus.drone.ftpController.readFile(
        path, progress_callback=progress_callback
    )

    # Convert bytes to list for SocketIO serialization
    if result.get("success") and "data" in result:
        data_dict = result["data"]
        if isinstance(data_dict, dict) and "file_data" in data_dict:
            data_dict["file_data"] = list(data_dict["file_data"])

    socketio.emit("read_file_result", result)
