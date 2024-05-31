import app.droneStatus as droneStatus
from app import socketio
from app.customTypes import MotorTestAllValues, MotorTestThrottleAndDuration


@socketio.on("test_one_motor")
def testOneMotor(data: MotorTestAllValues) -> None:
    """
    Tests one motor

    Args:
      data: The data passed from the frontend, contains all motor tests values (motor, throttle, duration)
    """
    if not droneStatus.drone:
        return

    result = droneStatus.drone.motorTestController.testOneMotor(data)
    socketio.emit(
        "motor_test_result",
        result,
    )


@socketio.on("test_motor_sequence")
def testMotorSequence(data: MotorTestThrottleAndDuration) -> None:
    """
    Tests motors in sequence

    Args:
      data: The data passed from the frontend, contains throttle and duration.
    """
    if not droneStatus.drone:
        return

    result = droneStatus.drone.motorTestController.testMotorSequence(data)
    socketio.emit("motor_test_result", result)


@socketio.on("test_all_motors")
def testAllMotors(data: MotorTestThrottleAndDuration) -> None:
    """
    Tests all motors

    Args:
      data: The data passed from the frontend, contains which throttle and duration.
    """
    if not droneStatus.drone:
        return

    result = droneStatus.drone.motorTestController.testAllMotors(data)
    socketio.emit("motor_test_result", result)
