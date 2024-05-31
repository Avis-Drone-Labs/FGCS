from __future__ import annotations

import functools
from typing import TYPE_CHECKING, Any, Callable

import serial
from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


class GripperController:
    def __init__(self, drone: Drone) -> None:
        """
        The gripper controls all gripper-related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone

        self.enabled = False

        gripper_enabled_response = self.drone.paramsController.getSingleParam(
            param_name="GRIP_ENABLE"
        )
        if not (gripper_enabled_response.get("success")):
            self.drone.logger.warning("Gripper is not enabled")
            return None

        gripper_enabled_response_data = gripper_enabled_response.get("data")
        if gripper_enabled_response_data:
            self.enabled = bool(gripper_enabled_response_data.param_value)
        self.params = {}

        if not self.enabled:
            self.drone.logger.warning("Gripper is not enabled")
        else:
            self.params = {
                "gripAutoclose": self.drone.paramsController.getSingleParam(
                    "GRIP_AUTOCLOSE"
                ).get("data"),
                "gripCanId": self.drone.paramsController.getSingleParam(
                    "GRIP_CAN_ID"
                ).get("data"),
                "gripGrab": self.drone.paramsController.getSingleParam("GRIP_GRAB").get(
                    "data"
                ),
                "gripNeutral": self.drone.paramsController.getSingleParam(
                    "GRIP_NEUTRAL"
                ).get("data"),
                "gripRegrab": self.drone.paramsController.getSingleParam(
                    "GRIP_REGRAB"
                ).get("data"),
                "gripRelease": self.drone.paramsController.getSingleParam(
                    "GRIP_RELEASE"
                ).get("data"),
                "gripType": self.drone.paramsController.getSingleParam("GRIP_TYPE").get(
                    "data"
                ),
            }

    @staticmethod
    def gripperEnabled(func: Callable[..., Any]) -> Callable[..., Any]:
        """
        Runs the decorated function only if the gripper is enabled."""

        @functools.wraps(func)
        def wrap(self, *args: Any, **kwargs: Any) -> Any:
            if not self.enabled:
                self.drone.logger.error("Gripper is not enabled")
                return False
            return func(self, *args, **kwargs)

        return wrap

    @gripperEnabled
    def setGripper(self, action: str) -> Response:
        """
        Sets the gripper to either release or grab.

        Args:
            action (str): The action to perform on the gripper, either "release" or "grab"

        Returns:
            Response
        """
        if action not in ["release", "grab"]:
            return {
                "success": False,
                "message": 'Gripper action must be either "release" or "grab"',
            }

        self.drone.is_listening = False

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

            self.is_listening = True

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
