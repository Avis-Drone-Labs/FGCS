from __future__ import annotations

import struct
import time
from threading import Thread
from typing import TYPE_CHECKING, Any, List, Optional, Callable

import serial
from app.customTypes import IncomingParam, Number, Response
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


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
        self.total_number_of_params = self.getNumberOfParams()
        self.is_requesting_params = False
        self.getAllParamsThread: Optional[Thread] = None
        self.requestAllParamsTimeout: int = 180  # Default timeout of 3 mins

    def setRequestAllParamsTimeout(self, timeout: int) -> None:
        self.requestAllParamsTimeout = timeout

    def getNumberOfParams(self) -> int:
        """Gets the number of parameters available on the drone

        Returns:
            int: The number of params available, or 0 if the request timed out
        """
        # Request all parameters
        self.drone.is_listening = False
        self.drone.master.mav.param_request_list_send(
            self.drone.master.target_system, self.drone.master.target_component
        )

        # Read param_count from the first message
        message = self.drone.master.recv_match(
            type="PARAM_VALUE", blocking=True, timeout=10
        )
        if message:
            total_params = message.param_count
            self.drone.logger.info(f"Total number of parameters: {total_params}")
        else:
            total_params = 0

        # Stop further param transmission
        self.drone.master.mav.param_request_read_send(
            self.drone.master.target_system, self.drone.master.target_component, b"", -1
        )

        # Clear message buffer
        while self.drone.master.recv_match(type="PARAM_VALUE"):
            pass

        return total_params

    def getSingleParam(self, param_name: str, timeout: Optional[float] = 2) -> Response:
        """
        Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (float, optional): The time to wait before failing to return the parameter. Defaults to 1 second.

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        self.drone.is_listening = False
        failure_message = f"Failed to get parameter {param_name}"

        self.drone.master.mav.param_request_read_send(
            self.drone.target_system,
            self.drone.target_component,
            param_name.encode(),
            -1,
        )

        try:
            timeout = time.time() + 5  # 5 seconds
            while True:
                response = self.drone.master.recv_match(
                    type="PARAM_VALUE", blocking=True, timeout=timeout
                )

                if response and response.param_id == param_name:
                    self.drone.is_listening = True
                    return {
                        "success": True,
                        "data": response,
                    }
                else:
                    if time.time() > timeout:
                        self.drone.is_listening = True
                        return {
                            "success": False,
                            "message": f"{failure_message}, timed out",
                        }
                    else:
                        continue

        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def getAllParams(
        self,
        timeoutCb: Callable,
        updateCb: Callable,
        completeCb: Callable,
        updateFreq: int = 1,
    ) -> None:
        """
        Request all parameters from the drone. Starts a thread which collects all recieved PARAM_VALUE
        messages, and calls the given callbacks at each relevant place:\n
        - timeoutCb should be of type `func(t: int)`, where t is the time in seconds that
        the process took before timing out\n
        - completeCb should be of type `func(p: list)`, where p is the list of parameters returned\n
        - updateCb should be of type `func(i: int, t: int)` where i is the index of the last
        loaded param and t is the total number of params

        Args:
            timeoutCb (typing.Callable): The callback to invoke if the thread times out
            completeCb (typing.Callable): The callback to invoke when the thread completes
            updateCb (typing.Callable): The callback to invoke at a fixed duration defined by `updateFreq`
            updateFreq (int): The frequency in seconds that updates should be sent back to the client. Default 1
        """
        self.drone.stopAllDataStreams()
        self.drone.is_listening = False

        self.getAllParamsThread = Thread(
            target=self.getAllParamsThreadFunc,
            daemon=True,
            args=(
                timeoutCb,
                updateCb,
                completeCb,
                updateFreq,
                self.requestAllParamsTimeout,
            ),
        )
        self.getAllParamsThread.start()

    def setFinishedRequestingParams(self) -> None:
        self.is_requesting_params = False
        self.current_param_index = 0
        self.drone.is_listening = True

    def getAllParamsThreadFunc(
        self,
        timeoutCb: Callable,
        updateCb: Callable,
        completeCb: Callable,
        updateFreq: int,
        timeout: int,
    ) -> None:
        """
        The thread function to get all parameters from the drone.

        Args:
            timeoutCb (typing.Callable): The callback to invoke if the thread times out
            completeCb (typing.Callable): The callback to invoke when the thread completes
            updateCb (typing.Callable): The callback to invoke at a fixed duration defined by `updateFreq`
            updateFreq (int): The frequency in seconds that updates should be sent back to the client. Default 1
        """
        timeoutEpoch = time.time() + timeout
        updateEpoch = time.time() + updateFreq

        # Default to 1400 if failure and try and resolve total during loop
        self.total_number_of_params = self.getNumberOfParams() or 1400
        self.drone.master.param_fetch_all()
        self.is_requesting_params = True

        self.drone.logger.info(f"Fetching {self.total_number_of_params} params")
        try:
            while time.time() < timeoutEpoch:
                if (
                    msg := self.drone.master.recv_match(
                        type="PARAM_VALUE", blocking=True, timeout=updateFreq
                    )
                ) is None:
                    time.sleep(0.2)
                    continue

                self.saveParam(msg.param_id, msg.param_value, msg.param_type)

                # Wrong param count
                if self.total_number_of_params != msg.param_count:
                    self.drone.logger.warning(
                        f"Total params updated from {self.total_number_of_params} to {msg.param_count}"
                    )
                    self.total_number_of_params = msg.param_count

                # Update callback
                if time.time() > updateEpoch:
                    updateCb(len(self.params), self.total_number_of_params)
                    updateEpoch += updateFreq

                # Loaded all params
                if len(self.params) == self.total_number_of_params:
                    self.params = sorted(self.params, key=lambda k: k["param_id"])
                    self.setFinishedRequestingParams()
                    self.drone.logger.info(
                        f"Success fetching {len(self.params)} params"
                    )
                    return completeCb(self.params)

        except serial.serialutil.SerialException:
            self.drone.logger.error("Serial exception while getting all params")
            self.setFinishedRequestingParams()
            return

        self.drone.logger.warning(
            f"Get all params thread timed out, loaded {len(self.params)} / {self.total_number_of_params}"
        )
        self.setFinishedRequestingParams()
        timeoutCb(self.requestAllParamsTimeout)

    def setMultipleParams(self, params_list: list[IncomingParam]) -> bool:
        """
        Sets multiple parameters on the drone.

        Args:
            params_list (list[IncomingParam]): The list of parameters to set

        Returns:
            bool: True if all parameters were set, False if any failed
        """
        if not params_list:
            return False

        for param in params_list:
            param_id = param.get("param_id")
            param_value = param.get("param_value")
            param_type = param.get("param_type")
            if not param_id or not param_value or not param_type:
                continue

            done = self.setParam(param_id, param_value, param_type)
            if not done:
                return False

        return True

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
