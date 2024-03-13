import functools
import time

import serial
from pymavlink import mavutil
from utils import commandAccepted


class Gripper:
    def __init__(self, master, target_system, target_component):
        self.master = master
        self.target_system = target_system
        self.target_component = target_component

        gripper_enabled_response = self.getParamValue("GRIP_ENABLE")
        if gripper_enabled_response is None:
            print("Gripper is not enabled")
            self.enabled = False
            return

        self.enabled = bool(gripper_enabled_response.param_value)
        self.params = {}

        if not self.enabled:
            print("Gripper is not enabled")
        else:
            self.params = {
                "gripAutoclose": self.getParamValue("GRIP_AUTOCLOSE"),
                "gripCanId": self.getParamValue("GRIP_CAN_ID"),
                "gripGrab": self.getParamValue("GRIP_GRAB"),
                "gripNeutral": self.getParamValue("GRIP_NEUTRAL"),
                "gripRegrab": self.getParamValue("GRIP_REGRAB"),
                "gripRelease": self.getParamValue("GRIP_RELEASE"),
                "gripType": self.getParamValue("GRIP_TYPE"),
            }

            print(self.params)

    def gripperEnabled(func):
        """Runs the decorated function only if the gripper is enabled"""

        @functools.wraps(func)
        def wrap(self, *args, **kwargs):
            if not self.enabled:
                print("Gripper is not enabled")
                return False
            return func(self, *args, **kwargs)

        return wrap

    @gripperEnabled
    def setGripper(self, action):
        if action not in ["release", "grab"]:
            print('Gripper action must be either "release" or "grab"')
            return False

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
        success = True

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_GRIPPER):
                print(f"Setting gripper to {action}")
            else:
                print("Setting gripper failed")
                success = False
        except serial.serialutil.SerialException:
            print("Setting gripper failed, serial exception")
            success = False

        return success

    def getParamValue(self, param_name, timeout=None):
        self.master.mav.param_request_read_send(
            self.target_system, self.target_component, param_name.encode(), -1
        )

        now = time.gmtime()

        while True:
            try:
                response = self.master.recv_match(type="PARAM_VALUE", blocking=True)
                if time.gmtime().tm_sec - now.tm_sec > 3:
                    return

                if response.param_id == "STAT_RUNTIME":
                    continue

                if response.param_id == param_name:
                    return response
            except serial.serialutil.SerialException:
                print("Failed to get gripper parameter value, serial exception")
                self.enabled = False
                return
