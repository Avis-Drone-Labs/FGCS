from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test
from .helpers import FakeTCP, NoAcknowledgementMessage


def validate_motor_test_values(
    droneStatus, params, expected_throttle=0, expected_duration=0, expected_err=None
):
    """Helper function to validate motor test values for throttle and duration."""
    (
        throttle,
        duration,
        err,
    ) = droneStatus.drone.motorTestController.checkMotorTestValues(params)
    assert throttle == expected_throttle
    assert duration == expected_duration
    assert err == expected_err


def run_motor_test(droneStatus, test_func, params, expected_success, expected_message):
    """Helper function to run a motor test and check the response."""
    data = test_func(params)
    assert data.get("success") == expected_success
    assert data.get("message") == expected_message


@falcon_test(pass_drone_status=True)
def test_checkMotorTestValues(client: SocketIOTestClient, droneStatus):
    # Invalid throttle tests - Invalid 1, Invalid Boundary 1, Invalid 2, Invalid Boundary 2, Invalid 3
    validate_motor_test_values(
        droneStatus,
        {"throttle": 200, "duration": 10},
        expected_err="Invalid value for throttle",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": 101, "duration": 10},
        expected_err="Invalid value for throttle",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": -1, "duration": 10},
        expected_err="Invalid value for throttle",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": -100, "duration": 10},
        expected_err="Invalid value for throttle",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": None, "duration": 10},
        expected_err="Invalid value for throttle",
    )

    # Invalid duration tests - Invalid 1, Invalid Boundary, Invalid 2
    validate_motor_test_values(
        droneStatus,
        {"throttle": 50, "duration": -200},
        expected_err="Invalid value for duration",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": 50, "duration": -1},
        expected_err="Invalid value for duration",
    )
    validate_motor_test_values(
        droneStatus,
        {"throttle": 50, "duration": None},
        expected_err="Invalid value for duration",
    )

    # Valid throttle and duration
    validate_motor_test_values(
        droneStatus,
        {"throttle": 50, "duration": 5},
        expected_throttle=50,
        expected_duration=5,
        expected_err=None,
    )


@falcon_test(pass_drone_status=True)
def test_testOneMotor(client: SocketIOTestClient, droneStatus):
    test_func = droneStatus.drone.motorTestController.testOneMotor

    # Invalid throttle tests - Invalid 1, Invalid Boundary Upper, Invalid 2, Invalid Boundary Lower, Invalid 3
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 200, "duration": 10, "motorInstance": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 101, "duration": 10, "motorInstance": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -1, "duration": 10, "motorInstance": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -100, "duration": 10, "motorInstance": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": None, "duration": 10, "motorInstance": 4},
        False,
        "Invalid value for throttle",
    )

    # Invalid duration tests - Invalid 1, Invalid Boundary, Invalid 2
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -200, "motorInstance": 4},
        False,
        "Invalid value for duration",
    )  #
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -1, "motorInstance": 4},
        False,
        "Invalid value for duration",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": None, "motorInstance": 4},
        False,
        "Invalid value for duration",
    )

    # Invalid motorInstance tests - Invalid Boundary, Invalid 1, Invalid
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "motorInstance": 0},
        False,
        "Invalid value for motorInstance",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "motorInstance": -100},
        False,
        "Invalid value for motorInstance",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "motorInstance": None},
        False,
        "Invalid value for motorInstance",
    )

    # Serial exception simulation
    with FakeTCP():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "motorInstance": 4},
            False,
            "Motor test for motor D not started, serial exception",
        )

    # Motor test not started due to not receiving acknowledgement message
    with NoAcknowledgementMessage():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "motorInstance": 4},
            False,
            "Motor test for motor D not started",
        )

    # Valid motor test
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "motorInstance": 4},
        True,
        "Motor test started for motor D",
    )


@falcon_test(pass_drone_status=True)
def test_testMotorSequence(client: SocketIOTestClient, droneStatus):
    test_func = droneStatus.drone.motorTestController.testMotorSequence

    # Invalid throttle tests - Invalid 1, Invalid Boundary Upper, Invalid 2, Invalid Boundary Lower, Invalid 3
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 200, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 101, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": None, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -1, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -100, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )

    # Invalid duration tests - Invalid 1, Invalid Boundary, Invalid 2
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -200, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -1, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": None, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )

    # Invalid number_of_motors tests - Invalid Boundary, Invalid 1, Invalid
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": 0},
        False,
        "Invalid value for number_of_motors",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": -100},
        False,
        "Invalid value for number_of_motors",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": None},
        False,
        "Invalid value for number_of_motors",
    )

    # Serial exception simulation
    with FakeTCP():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "number_of_motors": 4},
            False,
            "Motor sequence test not started, serial exception",
        )

    # Motor test not started due to not receiving acknowledgement message
    with NoAcknowledgementMessage():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "number_of_motors": 4},
            False,
            "Motor sequence test not started",
        )

    # Valid motor sequence test
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": 4},
        True,
        "Motor sequence test started",
    )


@falcon_test(pass_drone_status=True)
def test_testAllMotors(client: SocketIOTestClient, droneStatus):
    test_func = droneStatus.drone.motorTestController.testAllMotors

    # Invalid throttle tests - Invalid 1, Invalid Boundary Upper, Invalid 2, Invalid Boundary Lower, Invalid 3
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 150, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 101, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -100, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": -1, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": None, "duration": 10, "number_of_motors": 4},
        False,
        "Invalid value for throttle",
    )

    # Invalid duration tests - Invalid 1, Invalid Boundary, Invalid 2
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -200, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": -1, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": None, "number_of_motors": 4},
        False,
        "Invalid value for duration",
    )

    # Invalid number_of_motors tests - Invalid Boundary, Invalid 1, Invalid 2
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": 0},
        False,
        "Invalid value for number_of_motors",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": -100},
        False,
        "Invalid value for number_of_motors",
    )
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": None},
        False,
        "Invalid value for number_of_motors",
    )

    # Serial exception simulation
    with FakeTCP():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "number_of_motors": 4},
            False,
            "All motor test not started, serial exception",
        )

    # Motor test not started due to not receiving acknowledgement message
    with NoAcknowledgementMessage():
        run_motor_test(
            droneStatus,
            test_func,
            {"throttle": 90, "duration": 10, "number_of_motors": 4},
            False,
            "All motor test successfully started 0 / 4 motors",
        )

    # Valid All motors test
    run_motor_test(
        droneStatus,
        test_func,
        {"throttle": 90, "duration": 10, "number_of_motors": 4},
        True,
        "All motor test started successfully",
    )
