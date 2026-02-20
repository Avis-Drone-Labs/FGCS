import pytest
from flask_socketio.test_client import SocketIOTestClient
from pymavlink.mavutil import mavlink

from . import falcon_test
from .helpers import NoDrone, set_params


@pytest.fixture(scope="session", autouse=True)
def setup_function():
    """
    Setup parameters before all tests run
    """

    params = [
        ("FLTMODE_CH", 6, mavlink.MAV_PARAM_TYPE_UINT8),
        ("RCMAP_PITCH", 2, mavlink.MAV_PARAM_TYPE_UINT8),
        ("RCMAP_ROLL", 1, mavlink.MAV_PARAM_TYPE_UINT8),
        ("RCMAP_THROTTLE", 3, mavlink.MAV_PARAM_TYPE_UINT8),
        ("RCMAP_YAW", 4, mavlink.MAV_PARAM_TYPE_UINT8),
    ]

    # Generate RC channel parameters for all 16 channels
    for channel in range(1, 17):
        # Default values - channels 1-8 use 1000-2000, others use 1100-1900
        min_val = 1000 if channel <= 8 else 1100
        max_val = 2000 if channel <= 8 else 1900

        option_val = 0
        if channel == 5:
            option_val = 153
        elif channel == 7:
            option_val = 7

        option_rev = 0
        if channel == 2:
            option_rev = 1

        params.extend(
            [
                (f"RC{channel}_MIN", min_val, mavlink.MAV_PARAM_TYPE_UINT16),
                (f"RC{channel}_MAX", max_val, mavlink.MAV_PARAM_TYPE_UINT16),
                (f"RC{channel}_REVERSED", option_rev, mavlink.MAV_PARAM_TYPE_UINT8),
                (f"RC{channel}_OPTION", option_val, mavlink.MAV_PARAM_TYPE_UINT8),
            ]
        )

    set_params(params)

    from app import droneStatus

    droneStatus.drone.rcController.fetchParams()  # Refresh RC data


@falcon_test(pass_drone_status=True)
def test_getRcConfig_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("get_rc_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to access the RC config."
    }


@falcon_test(pass_drone_status=True)
def test_getRcConfig_correctState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.rc"
    socketio_client.emit("get_rc_config")
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "rc_config"  # Correct name emitted
    assert socketio_result["args"][0] == {
        "pitch": 2.0,
        "roll": 1.0,
        "throttle": 3.0,
        "yaw": 4.0,
        "RC_1": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_2": {"min": 1000.0, "max": 2000.0, "reversed": 1.0, "option": 0.0},
        "RC_3": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_4": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_5": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 153.0},
        "RC_6": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_7": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 7.0},
        "RC_8": {"min": 1000.0, "max": 2000.0, "reversed": 0.0, "option": 0.0},
        "RC_9": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_10": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_11": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_12": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_13": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_14": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_15": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "RC_16": {"min": 1100.0, "max": 1900.0, "reversed": 0.0, "option": 0.0},
        "flight_modes": 6.0,
    }


@falcon_test(pass_drone_status=True)
def test_getRcConfig_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    with NoDrone():
        socketio_client.emit("get_rc_config")
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"  # Correct name emitted
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to get the RC config."
        }


@falcon_test(pass_drone_status=True)
def test_setRcConfigParam_wrongState(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "params"
    socketio_client.emit("set_rc_config_param", {"param_id": "RC1_OPTION", "value": 10})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to set RC config parameters."
    }


@falcon_test(pass_drone_status=True)
def test_setRcConfigParam_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    with NoDrone():
        socketio_client.emit(
            "set_rc_config_param", {"param_id": "RC1_OPTION", "value": 10}
        )
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to set a RC config parameter."
        }


@falcon_test(pass_drone_status=True)
def test_setRcConfigParam_missingData(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.rc"

    # Missing value
    socketio_client.emit("set_rc_config_param", {"param_id": "RC1_OPTION"})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "Param ID and value must be specified."
    }

    # Missing param_id
    socketio_client.emit("set_rc_config_param", {"value": 10})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "Param ID and value must be specified."
    }


@falcon_test(pass_drone_status=True)
def test_setRcConfigParam_success(socketio_client: SocketIOTestClient, droneStatus):
    droneStatus.state = "config.rc"

    socketio_client.emit("set_rc_config_param", {"param_id": "RC1_OPTION", "value": 25})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "set_rc_config_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "Parameter RC1_OPTION successfully set to 25.",
        "param_id": "RC1_OPTION",
        "value": 25,
    }


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "params"
    socketio_client.emit(
        "batch_set_rc_config_params",
        {
            "params": [
                {"param_id": "RC1_MIN", "value": 1000},
                {"param_id": "RC1_MAX", "value": 2000},
            ]
        },
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "params_error"
    assert socketio_result["args"][0] == {
        "message": "You must be on the config screen to set RC config parameters."
    }


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_noDroneConnection(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    with NoDrone():
        socketio_client.emit(
            "batch_set_rc_config_params",
            {
                "params": [
                    {"param_id": "RC1_MIN", "value": 1000},
                    {"param_id": "RC1_MAX", "value": 2000},
                ]
            },
        )
        socketio_result = socketio_client.get_received()[0]

        assert socketio_result["name"] == "connection_error"
        assert socketio_result["args"][0] == {
            "message": "Must be connected to the drone to set multiple RC config parameters."
        }


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_emptyParams(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    socketio_client.emit("batch_set_rc_config_params", {"params": []})
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "batch_set_rc_config_result"
    assert socketio_result["args"][0] == {
        "success": True,
        "message": "No parameters specified.",
    }


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_missingData(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    # Missing value in one param
    socketio_client.emit(
        "batch_set_rc_config_params",
        {"params": [{"param_id": "RC1_MIN"}, {"param_id": "RC1_MAX", "value": 2000}]},
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "batch_set_rc_config_result"
    assert socketio_result["args"][0]["success"] is False
    assert (
        socketio_result["args"][0]["message"] == "Param ID and value must be specified."
    )


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_success(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    socketio_client.emit(
        "batch_set_rc_config_params",
        {
            "params": [
                {"param_id": "RC1_MIN", "value": 1050},
                {"param_id": "RC1_MAX", "value": 1950},
                {"param_id": "RC1_REVERSED", "value": 1},
            ]
        },
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "batch_set_rc_config_result"
    assert socketio_result["args"][0]["success"] is True
    assert "Set 3 parameters successfully" in socketio_result["args"][0]["message"]
    assert socketio_result["args"][0]["data"] == [
        {"param_id": "RC1_MIN", "value": 1050},
        {"param_id": "RC1_MAX", "value": 1950},
        {"param_id": "RC1_REVERSED", "value": 1},
    ]


@falcon_test(pass_drone_status=True)
def test_batchSetRcConfigParams_partialFailure(
    socketio_client: SocketIOTestClient, droneStatus
):
    droneStatus.state = "config.rc"

    # Include an invalid parameter that will fail
    socketio_client.emit(
        "batch_set_rc_config_params",
        {
            "params": [
                {"param_id": "RC1_MIN", "value": 1050},
                {"param_id": "INVALID_PARAM", "value": 999},
                {"param_id": "RC1_MAX", "value": 1950},
            ]
        },
    )
    socketio_result = socketio_client.get_received()[0]

    assert socketio_result["name"] == "batch_set_rc_config_result"
    assert socketio_result["args"][0]["success"] is False
    assert "Failed to set 1 parameters" in socketio_result["args"][0]["message"]
    assert "INVALID_PARAM" in socketio_result["args"][0]["message"]
    # Should still have 2 successful params
    assert len(socketio_result["args"][0]["data"]) == 2
