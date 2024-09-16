import pytest
from typing import Optional
import app.droneStatus as DroneStatusType
from pymavlink.mavutil import mavtcp

from flask_socketio.test_client import SocketIOTestClient
from . import falcon_test, FakeTCP

def assert_motorResult(data: dict, success: bool, motor: Optional[str] = None, err: Optional[str] = None) -> None:
    """
    Recieves the data from the socketio_client and checks whether the sent data contains the expected value
    """
    testResult = data['args'][0]
    assert testResult['success'] is success
    if motor:
        assert testResult['message'] == f'Motor test started for motor {motor}'
    if err:
        assert testResult['message'] == err

def send_testOneMotor(client: SocketIOTestClient, motor: str, throttle: float, duration: int) -> dict:
    """
    Tests one motor with the given params and returns the result 
    """
    client.emit("test_one_motor", {"motorInstance": motor, "throttle": throttle, "duration": duration})
    return client.get_received()[0]

def send_testMotorSequence(client: SocketIOTestClient, throttle: float, duration: int) -> dict:
    client.emit("test_motor_sequence", {"throttle": throttle, "duration": duration})
    return client.get_received()[0]

@falcon_test(pass_drone_status=True)
def test_testOneMotor(
        socketio_client: SocketIOTestClient,
        droneStatus: DroneStatusType
    ) -> None:

    # Test correct motor being tested
    result = send_testOneMotor(socketio_client, 1, 50, 1)
    assert_motorResult(result, True, 'A')
    result = send_testOneMotor(socketio_client, 2, 50, 1)
    assert_motorResult(result, True, 'B')
    result = send_testOneMotor(socketio_client, 3, 50, 1)
    assert_motorResult(result, True, 'C')
    result = send_testOneMotor(socketio_client, 4, 50, 1)
    assert_motorResult(result, True, 'D')

    # Test throttle edge cases
    result = send_testOneMotor(socketio_client, 1, 0, 1)
    assert_motorResult(result, True)
    result = send_testOneMotor(socketio_client, 1, 100, 1)
    assert_motorResult(result, True)

    # Test throttle fail (< 0 or > 100)
    result = send_testOneMotor(socketio_client, 1, -1, 1)
    assert_motorResult(result, False, err="Invalid value for throttle")
    result = send_testOneMotor(socketio_client, 1, 101, 1)
    assert_motorResult(result, False, err="Invalid value for throttle")

    # Test duration edge case
    result = send_testOneMotor(socketio_client, 1, 50, 0)
    assert_motorResult(result, True)

    # Test duration fail (< 0)
    result = send_testOneMotor(socketio_client, 1, 50, -1)
    assert_motorResult(result, False, err="Invalid value for duration")
    
    # Invalid motor instance (<= 0)
    result = send_testOneMotor(socketio_client, 0, 50, 1)
    assert_motorResult(result, False, err="Invalid value for motorInstance")

    # Invalid types used 
    with pytest.raises(TypeError):
        result = send_testOneMotor(socketio_client, 1.0, 50, 1)
    with pytest.raises(TypeError):
        result = send_testOneMotor(socketio_client, "1", 50, 1)
    
    # Test serial exception
    with FakeTCP():
        result = send_testOneMotor(socketio_client, 1, 50, 1)
        assert_motorResult(result, False, err='Motor test for motor A not started, serial exception')

@falcon_test()
def test_testMotorSequence(
        socketio_client: SocketIOTestClient
    ) -> None:

    # Test throttle edge cases
    result = send_testMotorSequence(socketio_client, 0, 1)
    assert_motorResult(result, True)
    result = send_testMotorSequence(socketio_client, 100, 1)
    assert_motorResult(result, True)

    # Test throttle fail (< 0 or > 100)
    result = send_testMotorSequence(socketio_client, -1, 1)
    assert_motorResult(result, False, err="Invalid value for throttle")
    result = send_testMotorSequence(socketio_client, 101, 1)
    assert_motorResult(result, False, err="Invalid value for throttle")

    # Test duration edge case
    result = send_testMotorSequence(socketio_client, 50, 0)
    assert_motorResult(result, True)

    # Test duration fail (< 0)
    result = send_testMotorSequence(socketio_client, 50, -1)
    assert_motorResult(result, False, err="Invalid value for duration")


    with FakeTCP():
        result = send_testMotorSequence(socketio_client, 50, 1)
        assert_motorResult(result, False, err="Motor sequence test not started, serial exception")