from __future__ import annotations

import struct
import time
from threading import Thread
from typing import TYPE_CHECKING, Any, List, Optional, Callable

import serial
from app.customTypes import IncomingParam, Number, Response, StoredParam
from pymavlink import mavutil
from pymavlink.dialects.v20.common import MAVLink_param_value_message

if TYPE_CHECKING:
    from app.drone import Drone


class ParamsController:
    def __init__(self, drone: Drone, timeout_fetch_one: float = 2, timeout_fetch_all: float = 20) -> None:
        """
        The Params controller controls all parameter related operations.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone
        self.numParams = 0

        self.timeout_all = timeout_fetch_all
        self.timeout_one = timeout_fetch_one

        self.params: dict[str, StoredParam] = {}

        self.getAllParams()


    def _registerParamValue(self, msg: MAVLink_param_value_message) -> None:
        """Register a parameter value from a PARAM_VALUE message recieved via mavlink

        Args:
            msg (MAVLink_param_value_message): The PARAM_VALUE message recieved
        """

        self.numParams = msg.param_count

        if msg.param_id in self.params:
            self.params[msg.param_id]["param_value"] = msg.param_value
            self.params[msg.param_id]["last_set"] = time.time()
            return

        self.params.update(
            {
                msg.param_id: {
                    "param_id": msg.param_id,
                    "param_value": msg.param_value,
                    "param_type": msg.param_type,
                    "param_index": msg.param_index,
                    "last_set": time.time(),
                }
            }
        )

    def getSingleParam(self, param_name: str) -> Response:
        """
        Gets a specific parameter value. To control

        Args:
            param_name (str): The name of the parameter to get

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        failure_message = f"Failed to get parameter {param_name}"

        requestTime = time.time()
        self.drone.master.param_fetch_one(param_name.encode())

        while time.time() < requestTime + self.timeout_one and self.params[param_name]["last_set"] < requestTime:
            time.sleep(0.05)

        # We got the param value
        success: bool = self.params[param_name]["last_set"] >= requestTime

        if not success:
            self.drone.logger.warning(f"Could not fetch param {param_name} at time {requestTime}")
            return {"success": False, "message": failure_message}

        return {
            "success": True,
            "data": self.params[param_name]["param_value"]
        }

    def getAllParams(self, timeoutCallback: Callable = lambda t: 0, updateCallback: Callable = lambda i, t: 0, completeCallback: Callable = lambda p: 0, updateFrequencySeconds: float = 1.0) -> None:
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

        self.getAllParamsThread = Thread(
            target=self.getAllParamsThreadFunc, daemon=True, args=(timeoutCallback, updateCallback, completeCallback, updateFrequencySeconds)
        )
        self.getAllParamsThread.start()

    def getChangedSince(self, fromTime: float) -> int:
        """Gets the number of parameters that have had their values changed since
        the given epoch time

        This means all parameters which have had a PARAM_VALUE message emitted
        since `time`

        Args:
            fromTime (float): The time from which parameter changes should be counted

        Returns:
            int: The number of parameters
        """
        return len([p for p in self.params if self.params[p]["last_set"] >= fromTime])

    def getAllParamsThreadFunc(self, timeoutCallback, updateCallback, completeCallback, updateFrequencySeconds) -> None:
        """
        The thread function to get all parameters from the drone.
        """

        requestTime = time.time()
        timeoutEpoch = requestTime + self.timeout_all
        nextUpdate = requestTime + updateFrequencySeconds

        self.drone.master.param_fetch_all()

        while (
            changed := self.getChangedSince(requestTime)
        ) < self.numParams and time.time() < timeoutEpoch:
                if time.time() >= nextUpdate:
                    self.drone.logger.info(f"Calling update, {changed} / {self.numParams}")
                    updateCallback(changed, self.numParams)
                    nextUpdate += updateFrequencySeconds
                time.sleep(0.05)
        changedParams = [
            self.params[p]
            for p in self.params
            if self.params[p]["last_set"] >= requestTime
        ]

        if len(changedParams) != self.numParams:
            # Timed out
            self.drone.logger.warning(
                f"Expeceted to recieve {self.numParams} param values, recieved {len(changedParams)}."
            )
            timeoutCallback(time.time() - requestTime)
        else:
            # Success! :D
            self.drone.logger.info(f"Succesfully loaded {self.numParams} params.")
            completeCallback(changedParams)

    def setMultipleParams(self, params_list: List[IncomingParam]) -> bool:
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
