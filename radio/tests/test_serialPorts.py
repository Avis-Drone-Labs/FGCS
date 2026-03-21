from flask_socketio.test_client import SocketIOTestClient

from .helpers import NoDrone, send_and_receive


def test_getSerialPortsConfig_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should return error when not on the serial ports config screen."""
    droneStatus.state = "dashboard"
    result = send_and_receive("get_serial_ports_config")
    assert result == {
        "message": "You must be on the serial ports config screen to access the serial ports config."
    }


def test_getSerialPortsConfig_noDrone(socketio_client: SocketIOTestClient, droneStatus):
    """Should return error when no drone is connected."""
    droneStatus.state = "config.serial_ports"
    with NoDrone():
        result = send_and_receive("get_serial_ports_config")
        assert "message" in result
        assert (
            "connected" in result["message"].lower()
            or "drone" in result["message"].lower()
        )


def test_getSerialPortsConfig_success(socketio_client: SocketIOTestClient, droneStatus):
    """Should return serial port config when on the correct screen and connected."""
    droneStatus.state = "config.serial_ports"
    socketio_client.emit("get_serial_ports_config")
    received = socketio_client.get_received()

    assert len(received) >= 1
    config_event = next(
        (r for r in received if r["name"] == "serial_ports_config"), None
    )
    assert config_event is not None

    config = config_event["args"][0]
    assert isinstance(config, dict)

    # Each port entry should have protocol, baud, options
    for port_key, port_data in config.items():
        assert "protocol" in port_data
        assert "baud" in port_data
        assert "options" in port_data


def test_setSerialPortConfigParam_wrongState(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should return error when not on the serial ports config screen."""
    droneStatus.state = "dashboard"
    result = send_and_receive(
        "set_serial_port_config_param",
        {"param_id": "SERIAL1_PROTOCOL", "value": 2},
    )
    assert result == {
        "message": "You must be on the serial ports config screen to set serial port config parameters."
    }


def test_setSerialPortConfigParam_noDrone(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should return error when no drone is connected."""
    droneStatus.state = "config.serial_ports"
    with NoDrone():
        result = send_and_receive(
            "set_serial_port_config_param",
            {"param_id": "SERIAL1_PROTOCOL", "value": 2},
        )
        assert "message" in result
        assert (
            "connected" in result["message"].lower()
            or "drone" in result["message"].lower()
        )


def test_setSerialPortConfigParam_missingParamId(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should return error when param_id is missing."""
    droneStatus.state = "config.serial_ports"
    result = send_and_receive(
        "set_serial_port_config_param",
        {"value": 2},
    )
    assert result == {"message": "Param ID and value must be specified."}


def test_setSerialPortConfigParam_missingValue(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should return error when value is missing."""
    droneStatus.state = "config.serial_ports"
    result = send_and_receive(
        "set_serial_port_config_param",
        {"param_id": "SERIAL1_PROTOCOL"},
    )
    assert result == {"message": "Param ID and value must be specified."}


def test_setSerialPortConfigParam_success(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Should successfully set a serial port param and return confirmation."""
    droneStatus.state = "config.serial_ports"

    # Get current config to find a valid param to set
    socketio_client.emit("get_serial_ports_config")
    received = socketio_client.get_received()
    config_event = next(
        (r for r in received if r["name"] == "serial_ports_config"), None
    )
    assert config_event is not None

    config = config_event["args"][0]
    # Pick the first port's protocol to set back to its current value (safe/idempotent)
    first_port_key = next(iter(config))
    port_number = first_port_key.split("_")[1]
    param_id = f"SERIAL{port_number}_PROTOCOL"
    current_value = config[first_port_key]["protocol"]

    socketio_client.emit(
        "set_serial_port_config_param",
        {"param_id": param_id, "value": current_value},
    )
    received = socketio_client.get_received()

    result_event = next(
        (r for r in received if r["name"] == "set_serial_port_config_result"), None
    )
    assert result_event is not None

    result = result_event["args"][0]
    assert result["success"] is True
    assert result["param_id"] == param_id
    assert result["value"] == current_value
