from __future__ import annotations

from threading import current_thread
from typing import TYPE_CHECKING

import serial
from app.customTypes import Number, Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone

GRIPPER_PARAMS = [
    "GRIP_CAN_ID",
    "GRIP_AUTOCLOSE",
    "GRIP_GRAB",
    "GRIP_NEUTRAL",
    "GRIP_REGRAB",
    "GRIP_RELEASE",
    "GRIP_TYPE",
]


class GripperController:
    def __init__(self, drone: Drone) -> None:
        """
        The gripper controls all gripper-related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.controller_id = f"gripper_{current_thread().ident}"
        self.drone = drone
        self.params: dict = {}

        if not self.getEnabledFromDrone():
            self.drone.logger.info("Gripper is not enabled.")
        else:
            self.getGripperParams()

    def getEnabledFromDrone(self) -> bool:
        """
        Gets the enabled status of the gripper by checking the value of the GRIP_ENABLE param

        Returns:
            Optional[bool]
        """
        self.drone.logger.debug("Fetching gripper enabled state")
        gripper_enabled_response = self.drone.paramsController.getSingleParam(
            param_name="GRIP_ENABLE"
        )
        if not (gripper_enabled_response.get("success")):
            self.drone.logger.warning(
                f"Gripper state could not be fetched from drone: {gripper_enabled_response.get('message')}"
            )
            return False

        gripper_enabled_response_data = gripper_enabled_response.get("data")
        if gripper_enabled_response_data:
            return bool(gripper_enabled_response_data.param_value)

        return False

    def getEnabled(self) -> bool:
        """
        Gets the cached enabled status of the gripper by checking the value of the GRIP_ENABLE param

        Returns:
            Optional[bool]
        """
        gripper_enabled_param = self.drone.paramsController.getCachedParam(
            "GRIP_ENABLE"
        )
        if not gripper_enabled_param:
            self.drone.logger.warning(
                "Gripper state could not be fetched from cache, fetching from drone"
            )
            return self.getEnabledFromDrone()

        return bool(gripper_enabled_param.get("param_value"))

    def getGripperParams(self) -> None:
        """
        Gets the gripper related parameters from the drone.
        """
        self.drone.logger.debug("Fetching gripper parameters")
        for param in GRIPPER_PARAMS:
            self.params[param] = self.drone.paramsController.getSingleParam(param)

    def setGripper(self, action: str) -> Response:
        """
        Sets the gripper to either release or grab.

        Args:
            action (str): The action to perform on the gripper, either "release" or "grab"

        Returns:
            Response
        """
        if not self.getEnabled():
            self.drone.logger.error("Gripper is not enabled")
            return {
                "success": False,
                "message": "Gripper is not enabled",
            }

        if action not in ["release", "grab"]:
            return {
                "success": False,
                "message": 'Gripper action must be either "release" or "grab"',
            }

        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        self.drone.sending_command_lock.acquire()

        try:
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

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                condition_func=lambda msg: msg.command
                == mavutil.mavlink.MAV_CMD_DO_GRIPPER,
            )

            self.drone.sending_command_lock.release()

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
            self.drone.sending_command_lock.release()
            return {
                "success": False,
                "message": "Setting gripper failed, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

    def enableGripper(self) -> Response:
        """
        Enable the gripper
        """

        success = self.drone.paramsController.setParam(
            "GRIP_ENABLE", 1, mavutil.mavlink.MAV_PARAM_TYPE_UINT8
        )

        if success:
            result = {
                "success": True,
            }
        else:
            result = {
                "success": False,
                "message": f"Failed to enable gripper",
            }

        return result

    def disableGripper(self) -> Response:
        """
        Disable the gripper
        """

        success = self.drone.paramsController.setParam(
            "GRIP_ENABLE", 0, mavutil.mavlink.MAV_PARAM_TYPE_UINT8
        )

        if success:
            result = {
                "success": True,
            }
        else:
            result = {
                "success": False,
                "message": f"Failed to disable gripper",
            }

        return result

    def getConfig(self) -> dict:
        """
        Get the current gripper config from cached parameters.
        """
        config = {}
        for param in GRIPPER_PARAMS:
            self.params[param] = self.drone.paramsController.getCachedParam(param)
            config[param] = self.params[param].get("param_value", "UNKNOWN")

        return config

    def setGripperParam(self, param_id: str, value: Number) -> bool:
        """
        Sets a gripper related parameter on the drone.
        """
        if param_id not in GRIPPER_PARAMS:
            self.drone.logger.error(
                f"Parameter {param_id} is not a valid gripper parameter"
            )
            return False

        param_type = self.params.get(param_id, {}).get("param_type", None)

        return self.drone.paramsController.setParam(param_id, value, param_type)
