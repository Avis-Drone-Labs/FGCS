import app.droneStatus as droneStatus
from app import logger, socketio
from app.utils import droneErrorCb
from app.customTypes import SetConfigParam, VehicleType

FAILSAFE_PARAMS = [
    "BATT_LOW_VOLT",
    "BATT_LOW_MAH",
    "BATT_FS_LOW_ACT",
    "BATT_CRT_VOLT",
    "BATT_CRT_MAH",
    "BATT_FS_CRT_ACT",
]

COPTER_FS_PARAMS = [
    "FS_THR_ENABLE",
    "RC_FS_TIMEOUT",
    "FS_GCS_TIMEOUT",
    "FS_GCS_ENABLE",
    "FS_EKF_THRESH",
    "FS_EKF_ACTION",
]

PLANE_FS_PARAMS = [
    "THR_FS_VALUE",
    "THR_FAILSAFE",
    "FS_GCS_ENABL",
    "FS_SHORT_ACTN",
    "FS_LONG_ACTN",
    "FS_SHORT_TIMEOUT",
    "FS_LONG_TIMEOUT",
]

failsafe_params = {}


@socketio.on("get_failsafe_config")
def getFailsafeConfig() -> None:
    """
    Sends the failsafe config to the frontend, only works when the config page is loaded.
    """
    if droneStatus.state != "config.failsafe":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the config screen to access the failsafe configuration."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        logger.warning("Attempted to get the failsafe config when drone is None.")
        droneErrorCb(
            "You must be connected to the drone to access the failsafe configuration."
        )
        return

    requested_params = []

    if droneStatus.drone.aircraft_type == VehicleType.FIXED_WING.value:
        requested_params = FAILSAFE_PARAMS + PLANE_FS_PARAMS
    if droneStatus.drone.aircraft_type == VehicleType.MULTIROTOR.value:
        requested_params = FAILSAFE_PARAMS + COPTER_FS_PARAMS

    failsafe_config = {}
    for param in requested_params:
        failsafe_params[param] = droneStatus.drone.paramsController.getSingleParam(
            param
        )
        if failsafe_params[param]["success"]:
            failsafe_config[param] = failsafe_params[param]["data"].param_value

    socketio.emit(
        "failsafe_config",
        {"params": failsafe_config},
    )


@socketio.on("set_failsafe_config_param")
def setFailsafeParam(data: SetConfigParam) -> None:
    """
    Sets a failsafe parameter based off data passed in, only works when the config page is loaded.
    """
    if droneStatus.state != "config.failsafe":
        socketio.emit(
            "params_error",
            {
                "message": "You must be on the config screen to access the failsafe configuration."
            },
        )
        logger.debug(f"Current state: {droneStatus.state}")
        return

    if not droneStatus.drone:
        logger.warning("Attempted to set a failsafe param when drone is None.")
        droneErrorCb(
            "You must be connected to the drone to access the failsafe configuration."
        )
        return

    param_id = data.get("param_id", None)
    value = data.get("value", None)

    if param_id is None or value is None:
        droneErrorCb("Param ID and value must be specified.")
        return

    param_type = None
    if (response := failsafe_params.get(param_id, {})).get("success", False):
        param_type = getattr(response.get("data"), "param_type", None)

    success = droneStatus.drone.paramsController.setParam(param_id, value, param_type)
    if success:
        result = {
            "success": True,
            "message": f"Parameter {param_id} successfully set to {value}.",
            "param_id": param_id,
            "value": value,
        }
    else:
        result = {
            "success": False,
            "message": f"Failed to set parameter {param_id} to {value}.",
        }
    socketio.emit("set_failsafe_param_result", result)
