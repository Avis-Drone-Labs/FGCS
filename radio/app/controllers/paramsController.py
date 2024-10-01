from __future__ import annotations

import struct
from threading import Thread
from typing import TYPE_CHECKING, Optional, Callable

from pymavlink import mavutil
from pymavlink.dialects.v20.common import MAVLink_param_value_message

from app.customTypes import IncomingParam, Number, Response
from app.utils import MessageBuffer

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
        self.is_requesting_params = False
        self.params = []

        self.getAllParamsThread: Optional[Thread] = None
        self.requestAllParamsTimeout: int = 180  # Default timeout of 3 mins

        self.param_message_buffer: MessageBuffer = MessageBuffer[
            MAVLink_param_value_message
        ]()
        self.drone.addMessageListener(
            "PARAM_VALUE", self.param_message_buffer.addMessage
        )

        self.total_number_of_params = 0

    def setRequestAllParamsTimeout(self, timeout: int) -> None:
        """Set the timeout value

        Parameters
        ----------
        timeout : int
            _description_
        """
        self.requestAllParamsTimeout = timeout

    def getSingleParam(self, param_name: str, timeout: Optional[float] = 2) -> Response:
        """
        Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (float, optional): The time to wait before failing to return the parameter. Defaults to 1 second.

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        failure_message = f"Failed to get parameter {param_name}"

        self.drone.master.mav.param_request_read_send(
            self.drone.target_system,
            self.drone.target_component,
            param_name.encode(),
            -1,
        )

        if (
            msg := self.param_message_buffer.findFirst(
                key=lambda m: m.param_id == param_name, timeout=timeout
            )
        ) is None:
            return {
                "success": False,
                "message": f"{failure_message}, timed out",
            }

        return {
            "success": True,
            "data": msg,
        }

    def getAllParams(
        self,
        timeoutCb: Callable = lambda t: 0,
        updateCb: Callable = lambda i, t: 0,
        completeCb: Callable = lambda p: 0,
        updateFreq: int = 1,
        blocking: bool = False,
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
        if blocking:
            self.getAllParamsThread.join()

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

        # Default to 1400 then update in loop
        self.total_number_of_params = 1400
        self.drone.is_listening = True
        self.drone.master.param_fetch_all()
        self.is_requesting_params = True
        self.drone.logger.info(f"Fetching {self.total_number_of_params} params")

        messages = self.param_message_buffer.getMessages(
            expected=self.total_number_of_params, timeout=timeout
        )
        for m in messages:
            self.saveParam(m.param_id, m.param_value, m.param_type)

            if self.total_number_of_params != m.param_count:
                self.drone.logger.warning(
                    f"Updated expected params from {self.total_number_of_params} to {m.param_count}"
                )
                self.total_number_of_params = m.param_count

        if len(messages) != self.total_number_of_params:
            # Timed out
            self.drone.logger.warning(
                f"Expeceted to recieve {self.total_number_of_params} param values, recieved {len(messages)}."
            )
            timeoutCb(timeout)
        else:
            # Success! :D
            self.drone.logger.info(
                f"Succesfully loaded {self.total_number_of_params} params."
            )
            completeCb(self.params)

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
                    return False
                # vfloat, = struct.unpack(">f", vstr)
            vfloat = float(param_value)
        except struct.error as e:
            self.drone.logger.error(
                f"Could not set parameter {param_name} with value {param_value}: {e}"
            )
            return False

        # Keep trying to set the parameter until we get an ack or run out of retries or timeout
        self.drone.master.param_set_send(
            param_name.upper(), vfloat, parm_type=param_type
        )

        if (
            msg := self.param_message_buffer.findFirst(
                key=lambda m: m.param_id == param_name, timeout=2
            )
        ) is None:
            self.drone.logger.error(f"Could not get success message for {param_name}")
            return False

        if param_name == msg.param_id:
            self.drone.logger.debug(
                f"Got parameter saving ack for {param_name} for value {param_value}"
            )
            self.saveParam(msg.param_id, msg.param_value, msg.param_type)
        else:
            self.drone.logger.warning(
                "Found message for param {msg.param_id}, expeceted {param_name}"
            )
            return False

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
