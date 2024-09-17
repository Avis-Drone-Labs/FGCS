import pytest
from typing import Optional
from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test, FakeTCP
from app import droneStatus as DroneStatusType

def assert_motorResult(data: dict, 
                        success: bool, 
                        motor: Optional[str] = None, 
                        err: Optional[str] = None) -> None:
    """
    Recieves the data from the socketio_client and checks asserts whether the recieved data contains the expected value

    Args:
        data (dict): The data recieved using `client.get_recieved()`
        success (bool): Whether the request should have been successful or not
        motor (str, optional): Which motor the request should have tested, default `None`
        err (str, optional): What the error message should have been, default `None`
    """
    test_result = data['args'][0]
    assert test_result['success'] is success
    if motor:
        assert test_result['message'] == f'Motor test started for motor {motor}'
    if err:
        assert test_result['message'] == err

def send_testOneMotor(client: SocketIOTestClient, 
                        motor: int, 
                        throttle: int, 
                        duration: int) -> dict:
    """
    Tests one motor with the given params and returns the result 

    Args:
        motor (int): The motor instance to test
        throttle (int): The throttle percentage to test at
        duration (int): The duration of the test
    
    Returns:
        dict: The data recieved from the client using `.get_recieved()`
    """
    client.emit("test_one_motor", {"motorInstance": motor, "throttle": throttle, "duration": duration})
    return client.get_received()[0]

def send_testMotorSequence(client: SocketIOTestClient, 
                            throttle: int, 
                            duration: int,
                            num_motors: int = 4,
                            test_all: bool = False) -> dict:
    """
    Tests a motor sequence with the given throttle and duration and returns the result

    Args:
        throttle (int): The throttle percentage to test at
        duration (int): The duration of the test
    
    Returns:
        dict: The data recieved from the client using `.get_recieved()`
    """
    client.emit("test_all_motors" if test_all else "test_motor_sequence", {"throttle": throttle, "duration": duration, "number_of_motors": num_motors})
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

@falcon_test(pass_drone_status=True)
def test_testMotorSequence(
    socketio_client: SocketIOTestClient,
    droneStatus: DroneStatusType
) -> None:

    # Test standard case
    result = send_testMotorSequence(socketio_client, 50, 1)
    assert_motorResult(result, True)

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

@falcon_test()
def test_testAllMotors(
    socketio_client: SocketIOTestClient
) -> None:
    
    result = send_testMotorSequence(socketio_client, 50, 1, test_all=True)
    assert_motorResult(result, True, err="")
    