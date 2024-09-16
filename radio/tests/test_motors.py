import itertools
from typing import Optional

from flask_socketio.test_client import SocketIOTestClient
from . import falcon_test


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
    client.send("test_one_motor", {"motorInstance": motor, "throttle": throttle, "duration": duration})
    return client.get_received()[0]

@falcon_test(pass_drone_status=True)
def test_testOneMotor(
        socketio_client: SocketIOTestClient,
        droneStatus,
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

