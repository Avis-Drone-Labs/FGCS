from __future__ import annotations

import functools
from typing import Callable, TYPE_CHECKING

import serial
from app.customTypes import Response
from pymavlink import mavutil
from app.utils import commandAccepted

if TYPE_CHECKING:
    from radio.app.drone import Drone


class Gripper:
    def __init__(self, drone: Drone) -> None:
        """The gripper controls all gripper-related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone

        self.enabled = False

        gripper_enabled_response = self.drone.getSingleParam(param_name="GRIP_ENABLE")
        if not (gripper_enabled_response.get("success")):
            print("Gripper is not enabled")
            return None

        self.enabled = bool(gripper_enabled_response.get("data").param_value)
        self.params = {}

        if not self.enabled:
            print("Gripper is not enabled")
        else:
            self.params = {
                "gripAutoclose": self.drone.getSingleParam("GRIP_AUTOCLOSE").get(
                    "data"
                ),
                "gripCanId": self.drone.getSingleParam("GRIP_CAN_ID").get("data"),
                "gripGrab": self.drone.getSingleParam("GRIP_GRAB").get("data"),
                "gripNeutral": self.drone.getSingleParam("GRIP_NEUTRAL").get("data"),
                "gripRegrab": self.drone.getSingleParam("GRIP_REGRAB").get("data"),
                "gripRelease": self.drone.getSingleParam("GRIP_RELEASE").get("data"),
                "gripType": self.drone.getSingleParam("GRIP_TYPE").get("data"),
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
        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_GRIPPER,
            0,
            0 if action == "release" else 1,
            0,
            0,
            0,
            0,
            0,
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)

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
