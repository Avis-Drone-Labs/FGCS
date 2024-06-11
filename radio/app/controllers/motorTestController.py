from __future__ import annotations

from typing import TYPE_CHECKING, Optional

import serial
from app.customTypes import MotorTestAllValues, MotorTestThrottleAndDuration,MotorTestThrottleDurationAndNumber, Response
from app.utils import commandAccepted
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
        throttle = data.get("throttle", -1)
        if 0 > throttle > 100:
            self.drone.logger.error(
                f"Invalid value for motor test throttle, got {throttle}"
            )
            return 0, 0, "Invalid value for throttle"

        duration = data.get("duration", -1)
        if duration < 0:
            self.drone.logger.error(
                f"Invalid value for motor test duration, got {duration}"
            )
            return 0, 0, "Invalid value for duration"

        return throttle, duration, None

    def testOneMotor(self, data: MotorTestAllValues) -> Response:
        """
        Test a single motor.

        Args:
            data (MotorTestAllValues): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        self.drone.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        motor_instance = data.get("motorInstance")
        if motor_instance is None:
            return {"success": False, "message": "No motor instance provided"}

        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            param1=motor_instance,  # ID of the motor to be tested
            param2=0,  # throttle type (PWM,% etc)
            param3=throttle,  # value of the throttle - 0 to 100%
            param4=duration,  # duration of the test in seconds
            param5=0,  # number of motors to test in a sequence
            param6=0,  # test order
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                self.drone.logger.info(f"Motor test started for motor {motor_instance}")
                return {
                    "success": True,
                    "message": f"Motor test started for motor {motor_instance}",
                }
            else:
                self.drone.logger.error(
                    f"Motor test for motor {motor_instance} not started",
                )
                return {
                    "success": False,
                    "message": f"Motor test for motor {motor_instance} not started",
                }
        except serial.serialutil.SerialException:
            self.drone.logger.error(
                f"Motor test for motor {motor_instance} not started, serial exception"
            )
            return {
                "success": False,
                "message": f"Motor test for motor {motor_instance} not started, serial exception",
            }

    def testMotorSequence(self, data: MotorTestThrottleDurationAndNumber) -> Response:
        """
        Test a sequence of motors.

        Args:
            data (MotorTestThrottleDurationAndNumber): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        self.drone.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            param1=0,  # ID of the motor to be tested
            param2=0,  # throttle type (PWM,% etc)
            param3=throttle,  # value of the throttle - 0 to 100%
            param4=duration,  # delay between tests in seconds
            param5=self.drone.number_of_motors
            + 1,  # number of motors to test in a sequence
            param6=0,  # test order
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)

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

        self.drone.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        for idx in range(1, self.drone.number_of_motors):
            self.drone.sendCommand(
                mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                param1=idx,  # ID of the motor to be tested
                param2=0,  # throttle type (PWM,% etc)
                param3=throttle,  # value of the throttle - 0 to 100%
                param4=duration,  # duration of the test in seconds
                param5=0,  # number of motors to test in a sequence
                param6=0,  # test order
            )

        responses = 0

        try:
            response = self.drone.master.recv_match(
                type="COMMAND_ACK", blocking=True, timeout=RESPONSE_TIMEOUT
            )

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                responses += 1
                self.drone.logger.debug(
                    f"All motor test started for {responses} motors"
                )
                if responses == self.drone.number_of_motors:
                    self.drone.logger.info("All motor test started")
                    return {"success": True, "message": "All motor test started"}
                elif responses < self.drone.number_of_motors:
                    # TODO: Test if this works, do we not have to put this in a while loop
                    # And wait for the command ack every loop, and once we receive one we restart the loop?
                    pass
                else:
                    self.drone.logger.info(
                        "All motor test potentially started, but received {responses} responses with {self.drone.number_of_motors} motors"
                    )
                    return {
                        "success": True,
                        "message": "All motor test potentially started",
                    }
            else:
                self.drone.logger.error("All motor not test started")
                return {"success": False, "message": "All motor test not started"}
        except serial.serialutil.SerialException:
            self.drone.logger.error("All motor test not started, serial exception")
            return {
                "success": False,
                "message": "All motor test not started, serial exception",
            }

        return {
            "success": False,
            "message": "Unknown status about all motor test",
        }
