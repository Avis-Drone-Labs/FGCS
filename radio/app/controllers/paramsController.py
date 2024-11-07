from __future__ import annotations

import time
import struct
from threading import Thread
from typing import Optional, Callable, List

from pymavlink import mavutil
from pymavlink.dialects.v20.common import MAVLink_param_value_message

from app import logger
from app.customTypes import IncomingParam, Number, Response, StoredParam


class ParamsController:
    def __init__(self, master) -> None:
        """
        The Params controller controls all parameter related operations.

        Args:
            master (mavlink.MAVLink): The mavlink master
        """
        self.master = master

        self.params: dict[str, StoredParam] = {}

        self.getAllParamsThread: Optional[Thread] = None
        self.totalNumberOfParams = 1400

    def getSingleParam(self, param_name: str, timeout: float = 2) -> Response:
        """
        Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (float, optional): The time to wait before failing to return the parameter. Defaults to 1 second.

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        failure_message = f"Failed to get parameter {param_name}"

        startTime = time.time()
        self.master.mav.param_request_read_send(
            self.master.target_system,
            self.master.target_component,
            param_name.encode(),
            -1,
        )
        param = self.getModifiedParamOrTimeout(param_name, timeout, startTime)

        if param is None:
            return {"success": False, "message": failure_message}
        return {"success": True, "data": param}

    def getAllParams(
        self,
        timeoutCb: Callable = lambda t: 0,
        updateCb: Callable = lambda i, t: 0,
        completeCb: Callable = lambda p: 0,
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

        self.getAllParamsThread = Thread(
            target=self.getAllParamsThreadFunc,
            daemon=True,
            args=(
                timeoutCb,
                updateCb,
                completeCb,
                updateFreq,
            ),
        )
        self.getAllParamsThread.start()

    def getAllParamsThreadFunc(
        self,
        timeoutCb: Callable,
        updateCb: Callable,
        completeCb: Callable,
        updateFreq: int,
    ) -> None:
        """
        The thread function to get all parameters from the drone.

        Args:
            timeoutCb (typing.Callable): The callback to invoke if the thread times out
            completeCb (typing.Callable): The callback to invoke when the thread completes
            updateCb (typing.Callable): The callback to invoke at a fixed duration defined by `updateFreq`
            updateFreq (int): The frequency in seconds that updates should be sent back to the client. Default 1
        """

        # Request all parameters, time.sleep just makes it work for some reason
        time.sleep(1)
        self.is_requesting_params = True
        startTime = time.time()
        self.master.param_fetch_all()
        time.sleep(1)
        params = self.getRefreshedParamsOrTimeout(10, updateCb, updateFreq, startTime)

        if len(params) != self.totalNumberOfParams:
            # Timed out
            logger.warning(
                f"Expeceted to recieve {self.totalNumberOfParams} param values, recieved {len(params)}."
            )
            timeoutCb(time.time() - startTime)
        else:
            # Success! :D
            logger.info(f"Succesfully loaded {self.totalNumberOfParams} params.")
            completeCb(params)
        self.is_requesting_params = False

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

            if not self.setParam(param_id, param_value, param_type):
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
                    logger.error("can't send %s of type %u" % (param_name, param_type))
                    return False
                # vfloat, = struct.unpack(">f", vstr)
            vfloat = float(param_value)
        except struct.error as e:
            logger.error(
                f"Could not set parameter {param_name} with value {param_value}: {e}"
            )
            return False

        # Keep trying to set the parameter until we get an ack or run out of retries or timeout
        self.master.param_set_send(param_name.upper(), vfloat, parm_type=param_type)

        param = self.getModifiedParamOrTimeout(param_name, 2)

        if param is None:
            logger.error(f"Could not get success message for {param_name}")
            return False
        else:
            logger.debug(
                f"Got parameter saving ack for {param_name} for value {param_value}"
            )

        return True

    def getModifiedParamOrTimeout(
        self, param_name: str, timeout: float, sentTime: float = 0
    ) -> Optional[StoredParam]:
        """Return the given parameter's value, if it was recieved later than the time
        that the read_param command was issues to `self.master`
        Returns`None` if the length of time it takes to get an updated value exceeds the given
        timeout

        Args:
            param_name (str): The name of the parameter to fetch the value of
            timeout (float): The timeout in seconds to keep watching the param value
            sentTime (float): The time which the command was sent, by default `time.time()`

        Returns:
            Optional[StoredParam]: The param information if it was succesfully changed, else `None`
        """
        sentTime = sentTime or time.time()
        timeoutEpoch = sentTime + timeout

        # loop until either the param has been updated or timeout is reached
        while (
            (param := self.params.get(param_name, None)) is None
            or param["last_set"] < sentTime
        ) and time.time() < timeoutEpoch:
            time.sleep(0.2)

        # If the param can't be found or if it was never fetched return None
        if param is None or param["last_set"] < sentTime:
            return None
        return param

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

    def getRefreshedParamsOrTimeout(
        self,
        timeout: int,
        updateCb: Callable,
        updateFreq: float = 1,
        sentTime: float | None = None,
    ) -> List:
        logger.info("Loading all parameters")
        sentTime = sentTime or time.time()
        timeoutEpoch = sentTime + timeout
        nextUpdate = sentTime + updateFreq
        while (
            changed := self.getChangedSince(sentTime)
        ) < self.totalNumberOfParams and time.time() < timeoutEpoch:
            if time.time() >= nextUpdate:
                logger.info(f"Calling update, {changed} / {self.totalNumberOfParams}")
                updateCb(changed, self.totalNumberOfParams)
                nextUpdate += updateFreq
            time.sleep(0.2)
        return [
            self.params[p]
            for p in self.params
            if self.params[p]["last_set"] >= sentTime
        ]

    def saveParam(self, msg: MAVLink_param_value_message) -> None:
        """
        Save a parameter to the params list.

        Args:
            param_name (str): The name of the parameter
            param_value (Number): The value of the parameter
            param_type (int): The type of the parameter
        """

        if msg.param_count != self.totalNumberOfParams:
            self.totalNumberOfParams = msg.param_count

        if msg.param_id in self.params:
            self.params[msg.param_id]["param_value"] = msg.param_value
            self.params[msg.param_id]["last_set"] = time.time()
        else:
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
