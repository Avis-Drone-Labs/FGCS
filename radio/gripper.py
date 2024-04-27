import functools
import time
from typing import Callable, Optional

import serial
from customTypes import Response
from pymavlink import mavutil
from pymavlink.mavutil import mavserial
from utils import commandAccepted


class Gripper:
    def __init__(
        self, master: mavserial, target_system: int, target_component: int
    ) -> None:
        """The gripper controls all gripper-related actions.

        Args:
            master (_type_): The master mavlink connection object
            target_system (_type_): The target system
            target_component (_type_): The target component
        """
        self.master = master
        self.target_system = target_system
        self.target_component = target_component

        self.enabled = False

        gripper_enabled_response = self.getParamValue("GRIP_ENABLE", timeout=1.5)
        if gripper_enabled_response is None:
            print("Gripper is not enabled")
            return None

        self.enabled = bool(gripper_enabled_response.param_value)
        self.params = {}

        if not self.enabled:
            print("Gripper is not enabled")
        else:
            self.params = {
                "gripAutoclose": self.getParamValue("GRIP_AUTOCLOSE", timeout=1.5),
                "gripCanId": self.getParamValue("GRIP_CAN_ID", timeout=1.5),
                "gripGrab": self.getParamValue("GRIP_GRAB", timeout=1.5),
                "gripNeutral": self.getParamValue("GRIP_NEUTRAL", timeout=1.5),
                "gripRegrab": self.getParamValue("GRIP_REGRAB", timeout=1.5),
                "gripRelease": self.getParamValue("GRIP_RELEASE", timeout=1.5),
                "gripType": self.getParamValue("GRIP_TYPE", timeout=1.5),
            }

    # @staticmethod
    def gripperEnabled(func: Callable) -> Callable:
        """Runs the decorated function only if the gripper is enabled."""

        @functools.wraps(func)
        def wrap(self, *args, **kwargs):
            if not self.enabled:
                print("Gripper is not enabled")
                return False
            return func(self, *args, **kwargs)

        return wrap

    @gripperEnabled
    def setGripper(self, action: str) -> Response:
        """Sets the gripper to either release or grab.

        Args:
            action (_type_): The action to perform on the gripper, either "release" or "grab"

        Returns:
            Response: _description_
        """
        if action not in ["release", "grab"]:
            return {
                "success": False,
                "message": 'Gripper action must be either "release" or "grab"',
            }

        message = self.master.mav.command_long_encode(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_DO_GRIPPER,
            0,  # Confirmation
            0,  # Gripper number (from 1 to maximum number of grippers on the vehicle).
            0 if action == "release" else 1,  # Gripper action: 0:Release 1:Grab
            0,
            0,
            0,
            0,
            0,
        )
        self.master.mav.send(message)

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_GRIPPER):
                return {
                    "success": True,
                    "message": f"Setting gripper to {action}",
                }
            else:
                return {
                    "success": False,
                    "message": "Setting gripper failed",
                }
        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Setting gripper failed, serial exception",
            }

    def getParamValue(self, param_name: str, timeout: Optional[int] = None):
        """Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (int, optional): The time to wait before failing to return the parameter. Defaults to None.

        Returns:
            Union[Dict, bool]: The parameter value TODO: Add type
        """
        self.master.mav.param_request_read_send(
            self.target_system, self.target_component, param_name.encode(), -1
        )

        now = time.gmtime()

        while True:
            try:
                response = self.master.recv_match(
                    type="PARAM_VALUE", blocking=True, timeout=timeout
                )

                if response is None:
                    self.enabled = False
                    return None

                if time.gmtime().tm_sec - now.tm_sec > 3:
                    return None

                if response.param_id == "STAT_RUNTIME":
                    continue

                if response.param_id == param_name:
                    return response
            except serial.serialutil.SerialException:
                print("Failed to get gripper parameter value, serial exception")
                self.enabled = False
                return None
