from __future__ import annotations

from typing import TYPE_CHECKING

import serial
from pymavlink import mavutil

from app.customTypes import Number, Response, SetConfigParam
from app.utils import commandAccepted

if TYPE_CHECKING:
    from app.drone import Drone


class ServoController:
    def __init__(self, drone: Drone) -> None:
        """
        The Servo controller handles all servo config related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone
        self.params: dict = {}
        self.param_types: dict = {}

        self.fetchParams()

    def _getAndSetParam(
        self, params_dict: dict, param_key: str, param_name: str
    ) -> None:
        """
        Gets and set the value of a parameter inside a dictionary.

        Args:
            params_dict (dict): The dictionary to store the parameters
            param_key (str): The key for the parameter within the dictionary
            param_name (str): The name of the parameter
        """
        param = self.drone.paramsController.getSingleParam(param_name).get("data")
        if param:
            params_dict[param_key] = param.param_value
            self.param_types[param_name] = param.param_type

    def _getAndSetCachedParam(
        self, params_dict: dict, param_key: str, param_name: str
    ) -> None:
        """
        Gets and set the value of a cached parameter inside a dictionary.

        Args:
            params_dict (dict): The dictionary to store the parameters
            param_key (str): The key for the parameter within the dictionary
            param_name (str): The name of the parameter
        """
        cached_param = self.drone.paramsController.getCachedParam(param_name)
        if cached_param:
            params_dict[param_key] = cached_param.get("param_value")
        else:
            self.drone.logger.warning(
                f"Param {param_name} not found in cache, fetching from drone"
            )
            fetched_param = self.drone.paramsController.getSingleParam(param_name).get(
                "data"
            )
            if fetched_param:
                params_dict[param_key] = fetched_param.param_value
                self.param_types[param_name] = fetched_param.param_type

    def fetchParams(self) -> None:
        """
        Fetches the servo parameters from the drone.
        """
        self.drone.logger.debug("Fetching servo parameters")

        for servo_number in range(1, 17):
            servo_params = self.params.get(f"SERVO_{servo_number}", {})

            self._getAndSetParam(
                servo_params, "function", f"SERVO{servo_number}_FUNCTION"
            )
            self._getAndSetParam(servo_params, "min", f"SERVO{servo_number}_MIN")
            self._getAndSetParam(servo_params, "trim", f"SERVO{servo_number}_TRIM")
            self._getAndSetParam(servo_params, "max", f"SERVO{servo_number}_MAX")
            self._getAndSetParam(
                servo_params, "reversed", f"SERVO{servo_number}_REVERSED"
            )

            self.params[f"SERVO_{servo_number}"] = servo_params

    def getConfig(self) -> dict:
        """
        Returns the servo configuration with the cached parameters.

        Returns:
            dict: The servo configuration
        """
        for servo_number in range(1, 17):
            servo_params = self.params.get(f"SERVO_{servo_number}", {})

            self._getAndSetCachedParam(
                servo_params, "function", f"SERVO{servo_number}_FUNCTION"
            )
            self._getAndSetCachedParam(servo_params, "min", f"SERVO{servo_number}_MIN")
            self._getAndSetCachedParam(
                servo_params, "trim", f"SERVO{servo_number}_TRIM"
            )
            self._getAndSetCachedParam(servo_params, "max", f"SERVO{servo_number}_MAX")
            self._getAndSetCachedParam(
                servo_params, "reversed", f"SERVO{servo_number}_REVERSED"
            )

            self.params[f"SERVO_{servo_number}"] = servo_params

        return self.params

    def setConfigParam(self, param_id: str, value: Number) -> bool:
        """
        Sets a servo configuration related parameter on the drone.
        """
        param_type = self.param_types.get(param_id)

        return self.drone.paramsController.setParam(param_id, value, param_type)

    def batchSetConfigParams(self, params: list[SetConfigParam]) -> Response:
        """
        Sets multiple servo configuration related parameters on the drone.
        """
        param_set_failures = []
        param_set_successes = []
        for item in params:
            param_id = item.get("param_id")
            value = item.get("value")
            if param_id and value is not None:
                if not self.setConfigParam(param_id, value):
                    param_set_failures.append(param_id)
                else:
                    param_set_successes.append({"param_id": param_id, "value": value})

        if len(param_set_failures) == 0:
            return {
                "success": True,
                "message": f"Set {len(param_set_successes)} parameters successfully.",
                "data": param_set_successes,
            }

        # Even though the batch operation may fail, some params may get set
        # successfully
        return {
            "success": False,
            "message": f"Failed to set {len(param_set_failures)} parameters: {param_set_failures}",
            "data": param_set_successes,
        }

    def setServo(self, servo_instance: int, pwm_value: int) -> Response:
        """Set a servo to a specific PWM value.

        Args:
            servo_instance (int): The number of the servo to set
            pwm_value (int): The PWM value to set the servo to

        Returns:
            Response: The response from the servo set command
        """
        if not self.drone.reserve_message_type("COMMAND_ACK", self.drone.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            self.drone.sendCommand(
                mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
                param1=servo_instance,  # Servo instance number
                param2=pwm_value,  # PWM value
            )

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.drone.controller_id,
                condition_func=lambda msg: msg.command
                == mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
            )

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_SET_SERVO):
                return {"success": True, "message": f"Setting servo to {pwm_value}"}
            else:
                self.drone.logger.error(
                    f"Failed to set servo {servo_instance} to {pwm_value}"
                )
                error_message = f"Failed to set servo {servo_instance} to {pwm_value}"
                error_code = response.result if response else None

                # Map specific error codes to user-friendly messages
                if error_code == 4:  # MAV_RESULT_FAILED
                    error_message = f"Channel {servo_instance} is already in use"
                elif error_code == 3:  # MAV_RESULT_UNSUPPORTED
                    error_message = f"Servo {servo_instance} is not supported"
                elif error_code == 2:  # MAV_RESULT_DENIED
                    error_message = f"Permission denied to set servo {servo_instance}"

                return {"success": False, "message": error_message}

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Setting servo failed, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.drone.controller_id)
