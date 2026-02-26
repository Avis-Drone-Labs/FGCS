import time
from typing import Any, List

from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import notConnectedError


class ExportParamsFileType(TypedDict):
    file_path: str


class MultipleParamsProgressDataType(TypedDict):
    message: str
    param_id: str
    current_index: int
    total_params: int


def setMultipleParamsProgressUpdateCallback(
    data: MultipleParamsProgressDataType,
) -> None:
    """
    Callback function to emit progress updates when setting multiple parameters.
    """
    socketio.emit("set_multiple_params_progress", data)


@socketio.on("set_multiple_params")
def set_multiple_params(params_list: List[Any]) -> None:
    """
    Set multiple parameters at the same time.

    Args:
        params_list: The list of parameters to be setting from the client.
    """
    if droneStatus.state != "params":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the params screen to save parameters."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    response = droneStatus.drone.paramsController.setMultipleParams(
        params_list, setMultipleParamsProgressUpdateCallback
    )
    if response.get("success"):
        socketio.emit("param_set_success", response)
    else:
        socketio.emit("params_error", response)


@socketio.on("refresh_params")
def refresh_params() -> None:
    """
    Refresh all parameters
    """
    if droneStatus.state != "params":
        socketio.emit(
            "params_error",
            {"message": "You must be on the params screen to refresh the parameters."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        return

    droneStatus.drone.paramsController.getAllParams()

    timeout_secs = 120

    timeout = time.time() + timeout_secs
    last_index_sent = -1

    while droneStatus.drone and droneStatus.drone.paramsController.is_requesting_params:
        if time.time() > timeout:
            socketio.emit(
                "params_error",
                {
                    "message": f"Parameter request timed out after {timeout_secs} seconds."
                },
            )
            return

        if (
            last_index_sent != droneStatus.drone.paramsController.current_param_index
            and droneStatus.drone.paramsController.current_param_index > last_index_sent
        ):
            socketio.emit(
                "param_request_update",
                {
                    "current_param_index": droneStatus.drone.paramsController.current_param_index,
                    "current_param_id": droneStatus.drone.paramsController.current_param_id,
                    "total_number_of_params": droneStatus.drone.paramsController.total_number_of_params,
                },
            )
            last_index_sent = droneStatus.drone.paramsController.current_param_index

        time.sleep(0.2)

    socketio.emit("params", droneStatus.drone.paramsController.params)


@socketio.on("export_params_to_file")
def export_params_to_file(data: ExportParamsFileType) -> None:
    """
    Export parameters to a file.

    Args:
        data: The data from the client containing the file path.
    """
    if droneStatus.state != "params":
        socketio.emit(
            "params_error",
            {"message": "You must be on the params screen to export parameters."},
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        notConnectedError(action="export params to file")
        return

    file_path = data.get("file_path", None)
    if not file_path:
        socketio.emit(
            "export_params_result",
            {"success": False, "message": "No file path provided."},
        )
        logger.error("No file path provided for exporting parameters.")
        return

    result = droneStatus.drone.paramsController.exportParamsToFile(file_path)

    socketio.emit("export_params_result", result)
