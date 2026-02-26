from app import socketio
import app.droneStatus as droneStatus
from app.utils import notConnectedError
from pymavlink import mavutil


@socketio.on("set_servo_pwm")
def set_servo_pwm(data):
    """
    Set a servo output to a specific PWM value.
    Args:
        data: dict with 'servo' (int, 1-based) and 'pwm' (int, microseconds)
    """
    if not droneStatus.drone:
        return notConnectedError(action="set servo PWM")

    servo = data.get("servo")
    pwm = data.get("pwm")
    if servo is None or pwm is None:
        socketio.emit("servo_test_error", {"message": "Missing servo or pwm value."})
        return

    # ArduPilot expects servo instance (1-based)
    droneStatus.drone.master.mav.command_long_send(
        droneStatus.drone.target_system,
        droneStatus.drone.target_component,
        mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
        0,  # confirmation
        servo,  # param1: servo number (1-based)
        pwm,  # param2: PWM value (microseconds)
        0,
        0,
        0,
        0,
        0,  # unused params
    )
    socketio.emit("servo_test_success", {"servo": servo, "pwm": pwm})
