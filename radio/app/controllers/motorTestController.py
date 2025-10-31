from __future__ import annotations

from threading import current_thread
from typing import TYPE_CHECKING, Optional

import serial
from app.customTypes import (
    MotorTestAllValues,
    MotorTestThrottleAndDuration,
    MotorTestThrottleDurationAndNumber,
    Response,
)
from app.utils import commandAccepted, sendingCommandLock
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


class MotorTestController:
    def __init__(self, drone: Drone) -> None:
        """
        The MotorTest controls all motor tests.

        Args:
            drone (Drone): The main drone object
        """
        self.controller_id = f"motortest_{current_thread().ident}"
        self.drone = drone

    def checkMotorTestValues(
        self, data: MotorTestThrottleAndDuration
    ) -> tuple[int, int, Optional[str]]:
        """
        Check the values for a motor test.

        Args:
            data (MotorTestThrottleAndDuration): The data to check

        Returns:
            tuple[int, int, Optional[str]]: The throttle, duration, and error message if it exists
        """
        # self.drone.logger.info(f"Testing drone values: {data}")
        throttle = data.get("throttle", -1)
        if throttle is None or (not (0 <= throttle <= 100)):
            self.drone.logger.error(
                f"Invalid value for motor test throttle, got {throttle}"
            )
            return 0, 0, "Invalid value for throttle"

        duration = data.get("duration", -1)
        if duration is None or duration < 0:
            self.drone.logger.error(
                f"Invalid value for motor test duration, got {duration}"
            )
            return 0, 0, "Invalid value for duration"

        return throttle, duration, None

    @sendingCommandLock
    def testOneMotor(self, data: MotorTestAllValues) -> Response:
        """
        Test a single motor.

        Args:
            data (MotorTestAllValues): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        motor_instance = data.get("motorInstance", None)

        if motor_instance is None or motor_instance < 1:
            self.drone.logger.error(
                f"Invalid value for motor instance, got {motor_instance}"
            )
            return {"success": False, "message": "Invalid value for motorInstance"}

        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        motor_letter = chr(64 + motor_instance)

        try:
            self.drone.sendCommand(
                mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                param1=motor_instance,  # ID of the motor to be tested
                param2=0,  # throttle type (PWM,% etc)
                param3=throttle,  # value of the throttle - 0 to 100%
                param4=duration,  # duration of the test in seconds
                param5=0,  # number of motors to test in a sequence
                param6=0,  # test order
            )

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                condition_func=lambda msg: msg.command
                == mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            )

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                self.drone.logger.info(f"Motor test started for motor {motor_instance}")
                return {
                    "success": True,
                    "message": f"Motor test started for motor {motor_letter}",
                }
            else:
                self.drone.logger.error(
                    f"Motor test for motor {motor_instance} not started",
                )
                return {
                    "success": False,
                    "message": f"Motor test for motor {motor_letter} not started",
                }

        except serial.serialutil.SerialException:
            self.drone.logger.error(
                f"Motor test for motor {motor_instance} not started, serial exception"
            )
            return {
                "success": False,
                "message": f"Motor test for motor {motor_letter} not started, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

    @sendingCommandLock
    def testMotorSequence(self, data: MotorTestThrottleDurationAndNumber) -> Response:
        """
        Test a sequence of motors.

        Args:
            data (MotorTestThrottleDurationAndNumber): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        num_motors = data.get("number_of_motors", None)
        if num_motors is None or num_motors < 1:
            self.drone.logger.error(
                f"Invalid value for number of motors, got {num_motors}"
            )
            return {"success": False, "message": "Invalid value for number_of_motors"}

        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            self.drone.sendCommand(
                mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                param1=0,  # ID of the motor to be tested
                param2=0,  # throttle type (PWM,% etc)
                param3=throttle,  # value of the throttle - 0 to 100%
                param4=duration,  # delay between tests in seconds
                param5=num_motors,  # number of motors to test in a sequence
                param6=0,  # test order
            )

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                condition_func=lambda msg: msg.command
                == mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            )

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                self.drone.logger.info("Motor sequence test started")
                return {"success": True, "message": "Motor sequence test started"}
            else:
                self.drone.logger.error("Motor sequence test not started")
                return {"success": False, "message": "Motor sequence test not started"}

        except serial.serialutil.SerialException:
            self.drone.logger.error("Motor sequence test not started, serial exception")
            return {
                "success": False,
                "message": "Motor sequence test not started, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

    @sendingCommandLock
    def testAllMotors(self, data: MotorTestThrottleDurationAndNumber) -> Response:
        """
        Test all motors.

        Args:
            data (MotorTestThrottleDurationAndNumber): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        # Timeout after 3 seconds waiting for the motor test confirmation
        RESPONSE_TIMEOUT = 3

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        # Validate number of motors
        num_motors = data.get("number_of_motors", None)
        if num_motors is None or num_motors < 1:
            self.drone.logger.error(
                f"Invalid value for number of motors, got {num_motors}"
            )
            return {"success": False, "message": "Invalid value for number_of_motors"}

        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            # Send all commands
            for idx in range(1, num_motors + 1):
                self.drone.sendCommand(
                    mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                    param1=idx,  # ID of the motor to be tested
                    param2=0,  # throttle type (PWM,% etc)
                    param3=throttle,  # value of the throttle - 0 to 100%
                    param4=duration,  # duration of the test in seconds
                    param5=0,  # number of motors to test in a sequence
                    param6=0,  # test order
                )

            successful_responses = 0
            # Attempt to gather all the command acknowledgements using the new system
            for _ in range(num_motors):
                response = self.drone.wait_for_message(
                    "COMMAND_ACK",
                    self.controller_id,
                    timeout=RESPONSE_TIMEOUT,
                    condition_func=lambda msg: msg.command
                    == mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                )
                if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                    successful_responses += 1

            # Return data based on the number of successful command acknowledgements
            if successful_responses == num_motors:
                self.drone.logger.info("All motor test started successfully")
                return {
                    "success": True,
                    "message": "All motor test started successfully",
                }
            elif successful_responses < num_motors:
                self.drone.logger.warning(
                    f"Number of successful responses ({successful_responses}) was less than number of motors ({num_motors})"
                )
                return {
                    "success": False,
                    "message": f"All motor test successfully started {successful_responses} / {num_motors} motors",
                }
            else:  # pragma: no cover
                # We should never reach this (since we should only ever have successful_responses <= num_motors)
                self.drone.logger.info(
                    f"All motor test potentially started, but received {successful_responses} responses with {num_motors} motors"
                )
                return {
                    "success": True,
                    "message": "All motor test potentially started",
                }

        except serial.serialutil.SerialException:
            self.drone.logger.error("All motor test not started, serial exception")
            return {
                "success": False,
                "message": "All motor test not started, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)
