from typing_extensions import NotRequired, TypedDict

import app.droneStatus as droneStatus
from app import socketio
from app.utils import notConnectedError


class ListFilesType(TypedDict):
    path: str


class ReadFileType(TypedDict):
    path: str
    save_path: NotRequired[str]


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


@socketio.on("list_log_files")
def listLogFiles() -> None:
    """
    Intelligently search for and list log files on the drone.
    Automatically finds the correct log directory (/logs, /APM/LOGS, etc.)
    """
    if not droneStatus.drone:
        return notConnectedError(action="list log files")

    result = droneStatus.drone.ftpController.listLogFiles()

    socketio.emit("list_log_files_result", result)


@socketio.on("read_file")
def readFile(data: ReadFileType) -> None:
    """
    Read/download a file from the drone's FTP server and save it locally

    Args:
        data: The data from the client, contains:
            - "path": The remote file path to read/download
            - "save_path": The local file path where to save the file
    """
    if not droneStatus.drone:
        return notConnectedError(action="read file")

    path = data.get("path", None)
    save_path = data.get("save_path", None)

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
        path, save_path=save_path, progress_callback=progress_callback
    )

    # Convert bytes to list for SocketIO serialization if file_data is present
    if result.get("success") and "data" in result:
        data_dict = result["data"]
        if isinstance(data_dict, dict) and "file_data" in data_dict:
            if data_dict["file_data"] is not None:
                data_dict["file_data"] = list(data_dict["file_data"])

    socketio.emit("read_file_result", result)
