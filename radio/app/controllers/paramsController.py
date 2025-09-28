from __future__ import annotations

import struct
import time
from threading import Thread
from typing import TYPE_CHECKING, Any, List, Optional

import serial
from app.customTypes import IncomingParam, Number, Response
from app.utils import sendingCommandLock
from pymavlink import mavutil
from typing_extensions import TypedDict

if TYPE_CHECKING:
    from app.drone import Drone


class CachedParam(TypedDict):
    param_name: str
    param_value: Number
    param_type: int


class ParamsController:
    def __init__(self, drone: Drone) -> None:
        """
        The Params controller controls all parameter related operations.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone
        self.params: List[Any] = []
        self.current_param_index = 0
        self.total_number_of_params = 0
        self.is_requesting_params = False
        self.getAllParamsThread: Optional[Thread] = None

    @sendingCommandLock
    def getSingleParam(self, param_name: str, timeout: float = 3) -> Response:
        """
        Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (float, optional): The time to wait before failing to return the parameter. Defaults to 1 second.

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        self.drone.is_listening = False
        time.sleep(0.1)  # Give some time to stop listening
        failure_message = f"Failed to get parameter {param_name}"

        self.drone.master.mav.param_request_read_send(
            self.drone.target_system,
            self.drone.target_component,
            param_name.encode(),
            -1,
        )

        try:
            start_time = time.time()
            response = None
            while time.time() - start_time < timeout:
                # timeout of 0.2 to recv_match to allow checking the overall timeout and not block forever
                msg = self.drone.master.recv_match(
                    type="PARAM_VALUE", blocking=True, timeout=0.2
                )

                if msg is None:
                    continue

                if msg.param_id == param_name:
                    response = msg
                    break

            self.drone.is_listening = True
            if response:
                self.saveParam(
                    response.param_id, response.param_value, response.param_type
                )
                return {
                    "success": True,
                    "data": response,
                }
            else:
                self.drone.logger.error(f"Did not receive {param_name} within timeout")
                return {
                    "success": False,
                    "message": f"{failure_message}, timed out",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def getAllParams(self) -> None:
        """
        Request all parameters from the drone.
        """
        self.drone.stopAllDataStreams()
        self.drone.is_listening = False

        self.getAllParamsThread = Thread(
            target=self.getAllParamsThreadFunc, daemon=True
        )
        self.getAllParamsThread.start()

        self.drone.master.param_fetch_all()
        self.is_requesting_params = True

    def getAllParamsThreadFunc(self) -> None:
        """
        The thread function to get all parameters from the drone.
        """
        timeout = time.time() + 20  # 20 seconds from now

        while True:
            try:
                if time.time() > timeout:
                    self.drone.logger.warning("Get all params thread timed out")
                    self.is_requesting_params = False
                    self.current_param_index = 0
                    self.total_number_of_params = 0
                    self.params = []
                    self.drone.is_listening = True
                    return

                msg = self.drone.master.recv_msg()
                if msg and msg.msgname == "PARAM_VALUE":
                    self.saveParam(msg.param_id, msg.param_value, msg.param_type)

                    self.current_param_index = msg.param_index

                    if self.total_number_of_params != msg.param_count:
                        self.total_number_of_params = msg.param_count

                    if msg.param_index == msg.param_count - 1:
                        self.is_requesting_params = False
                        self.current_param_index = 0
                        self.total_number_of_params = 0
                        self.params = sorted(self.params, key=lambda k: k["param_id"])
                        self.drone.is_listening = True
                        self.drone.logger.info("Got all params")
                        return
            except serial.serialutil.SerialException:
                self.is_requesting_params = False
                self.current_param_index = 0
                self.total_number_of_params = 0
                self.params = []
                self.drone.is_listening = True
                self.drone.logger.error("Serial exception while getting all params")
                return

    def setMultipleParams(self, params_list: list[IncomingParam]) -> Response:
        """
        Sets multiple parameters on the drone.

        Args:
            params_list (list[IncomingParam]): The list of parameters to set

        Returns:
            bool: True if all parameters were set, False if any failed
        """
        if not params_list:
            return {"success": False, "message": "No parameters to set"}

        params_set_successfully = []

        for param in params_list:
            param_id = param.get("param_id", None)
            param_value = param.get("param_value", None)
            param_type = param.get("param_type", None)
            param.pop("initial_value", None)  # Remove initial value if it exists

            if param_id is None or param_value is None or param_type is None:
                self.drone.logger.error(f"Invalid parameter data: {param}, skipping")
                continue

            done = self.setParam(param_id, param_value, param_type)
            if not done:
                return {
                    "success": False,
                    "message": f"Failed to set parameter {param_id}",
                }
            else:
                params_set_successfully.append(param)

        return {
            "success": True,
            "message": "All parameters set successfully",
            "data": params_set_successfully,
        }

    @sendingCommandLock
    def setParam(
        self,
        param_name: str,
        param_value: Number,
        param_type: int,
        retries: int = 3,
    ) -> bool:
        """
        Sets a single parameter on the drone.

        Args:
            param_name (str): The name of the parameter to set
            param_value (Number): The value to set the parameter to
            param_type (int): The type of the parameter
            retries (int, optional): The number of times a parameter will be attempted to be set. Defaults to 3.

        Returns:
            bool: True if the parameter was set, False if it failed
        """
        self.drone.is_listening = False
        got_ack = False
        save_timeout = 5

        try:
            # Check if value fits inside the param type
            # https://github.com/ArduPilot/pymavlink/blob/4d8c4ff274d41b9bc8da1a411cb172d39786e46b/mavparm.py#L30C10-L30C10
            if (
                param_type is not None
                and param_type != mavutil.mavlink.MAV_PARAM_TYPE_REAL32
            ):
                # need to encode as a float for sending - not being used
                if param_type == mavutil.mavlink.MAV_PARAM_TYPE_UINT8:
                    struct.pack(">xxxB", int(param_value))
                elif param_type == mavutil.mavlink.MAV_PARAM_TYPE_INT8:
                    struct.pack(">xxxb", int(param_value))
                elif param_type == mavutil.mavlink.MAV_PARAM_TYPE_UINT16:
                    struct.pack(">xxH", int(param_value))
                elif param_type == mavutil.mavlink.MAV_PARAM_TYPE_INT16:
                    struct.pack(">xxh", int(param_value))
                elif param_type == mavutil.mavlink.MAV_PARAM_TYPE_UINT32:
                    struct.pack(">I", int(param_value))
                elif param_type == mavutil.mavlink.MAV_PARAM_TYPE_INT32:
                    struct.pack(">i", int(param_value))
                else:
                    self.drone.logger.error(
                        "can't send %s of type %u" % (param_name, param_type)
                    )
                    self.drone.is_listening = True
                    return False
                # vfloat, = struct.unpack(">f", vstr)
            vfloat = float(param_value)
        except struct.error as e:
            self.drone.logger.error(
                f"Could not set parameter {param_name} with value {param_value}: {e}"
            )
            self.drone.is_listening = True
            return False

        # Keep trying to set the parameter until we get an ack or run out of retries or timeout
        while retries > 0 and not got_ack:
            retries -= 1
            self.drone.master.param_set_send(
                param_name.upper(), vfloat, parm_type=param_type
            )
            tstart = time.time()
            while time.time() - tstart < save_timeout:
                ack = self.drone.master.recv_match(type="PARAM_VALUE")
                if ack is None:
                    time.sleep(0.1)
                    continue
                if str(param_name).upper() == str(ack.param_id).upper():
                    got_ack = True
                    self.drone.logger.debug(
                        f"Got parameter saving ack for {param_name} for value {param_value}"
                    )
                    self.saveParam(ack.param_id, ack.param_value, ack.param_type)
                    break

        if not got_ack:
            self.drone.logger.error(f"timeout setting {param_name} to {vfloat}")
            self.drone.is_listening = True
            return False

        self.drone.is_listening = True
        return True

    def saveParam(self, param_name: str, param_value: Number, param_type: int) -> None:
        """
        Save a parameter to the params list.

        Args:
            param_name (str): The name of the parameter
            param_value (Number): The value of the parameter
            param_type (int): The type of the parameter
        """
        existing_param_idx = next(
            (i for i, x in enumerate(self.params) if x["param_id"] == param_name), None
        )

        if existing_param_idx is not None:
            self.params[existing_param_idx]["param_value"] = param_value
        else:
            self.params.append(
                {
                    "param_id": param_name,
                    "param_value": param_value,
                    "param_type": param_type,
                }
            )

    def getCachedParam(self, params: str) -> CachedParam:
        """
        Get a single parameter from the cached params.

        Args:
            params (Optional[str]): The name of the parameter to get
        """
        if isinstance(params, str):
            try:
                return next((x for x in self.params if x["param_id"] == params))
            except StopIteration:
                self.drone.logger.error(f"Param {params} not found in cached params")
                return {}
        else:
            self.drone.logger.error(f"Invalid params type, got {type(params)}")
            return {}
