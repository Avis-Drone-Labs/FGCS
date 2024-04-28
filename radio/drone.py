import copy
import os
import struct
import time
import traceback
from pathlib import Path
from queue import Queue
from secrets import token_hex
from threading import Thread
from typing import Callable, Optional, Union

import serial
from customTypes import (
    IncomingParam,
    MotorTestAllValues,
    MotorTestThrottleAndDuration,
    Number,
    Response,
    ResponseWithData,
)
from flightModes import FlightModes
from gripper import Gripper
from mission import Mission
from pymavlink import mavutil
from utils import commandAccepted

LOG_LINE_LIMIT = 50000

DATASTREAM_RATES_WIRED = {
    mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_POSITION: 3,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 20,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA2: 10,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 3,
}

DATASTREAM_RATES_WIRELESS = {
    mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS: 1,
    mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS: 1,
    mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS: 1,
    mavutil.mavlink.MAV_DATA_STREAM_POSITION: 1,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 4,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA2: 3,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 1,
}


class Drone:
    def __init__(
        self,
        port: str,
        baud: int = 57600,
        wireless: bool = False,
        droneErrorCb: Optional[Callable] = None,
        droneDisconnectCb: Optional[Callable] = None,
    ) -> None:
        """
        The drone class interfaces with the UAS via MavLink.

        Args:
            port (str): The port to connect to the drone.
            baud (int, optional): The baud rate for the connection. Defaults to 57600.
            wireless (bool, optional): Whether the connection is wireless. Defaults to False.
            droneErrorCb (Optional[Callable], optional): Callback function for drone errors. Defaults to None.
            droneDisconnectCb (Optional[Callable], optional): Callback function for drone disconnection. Defaults to None.
        """
        self.port = port
        self.baud = baud
        self.wireless = wireless
        self.droneErrorCb = droneErrorCb
        self.droneDisconnectCb = droneDisconnectCb

        self.connectionError: Optional[str] = None

        try:
            self.master = mavutil.mavlink_connection(port, baud=baud)
        except PermissionError as e:
            self.master = None
            self.connectionError = str(e)
            return

        initial_heartbeat = self.master.wait_heartbeat()
        self.autopilot = initial_heartbeat.autopilot
        self.target_system = self.master.target_system
        self.target_component = self.master.target_component

        print(
            f"Heartbeat received (system {self.target_system} component {self.target_component})"
        )

        self.message_listeners = {}
        self.message_queue: Queue = Queue()
        self.log_message_queue: Queue = Queue()
        self.log_directory = Path.home().joinpath("FGCS", "logs")
        self.log_directory.mkdir(parents=True, exist_ok=True)
        self.current_log_file = None
        self.log_file_names = []
        self.cleanTempLogs()

        self.is_active = True
        self.is_requesting_params = False
        self.current_param_index = 0
        self.total_number_of_params = 0
        self.number_of_motors = 4  # Is there a way to get this from the drone?
        self.params = []

        self.armed = False

        self.flight_modes = FlightModes(self)

        self.gripper = Gripper(self.master, self.target_system, self.target_component)
        self.mission = Mission(self)

        self.stopAllDataStreams()

        self.is_listening = True

        self.startThread()

    def __getNextLogFilePath(self, line: str) -> str:
        return line.split("==NEXT_FILE==")[-1].split("==END==")[0]

    def __getCurrentDateTimeStr(self) -> str:
        return time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime())

    def cleanTempLogs(self) -> None:
        """
        Clean up and try to recover any temporary log files that were not properly closed.
        """
        log_files = [
            file
            for file in self.log_directory.iterdir()
            if file.is_file() and file.name.startswith("tmp_")
        ]
        first_recovered_log_files = [
            file for file in log_files if file.name.startswith("tmp_first_")
        ]

        number_of_first_recovered_log_files = 0

        # Go through each first ("starting") log file
        for first_recovered_log_file in first_recovered_log_files:
            exif_date = None
            final_recovered_log_file = self.log_directory.joinpath(
                f"RECOVERED_TMP_{self.__getCurrentDateTimeStr()}.ftlog"
            )
            no_next_log_file_flag = False
            next_log_file = None

            with open(final_recovered_log_file, "a") as final_recovered_log_file_handle:
                with open(first_recovered_log_file) as first_recovered_log_file_handle:
                    lines = first_recovered_log_file_handle.readlines()
                    first_line = lines[0]
                    last_line = lines[-1]

                    if first_line.startswith("==START_TIME=="):
                        exif_date = first_line.split("==START_TIME==")[-1].split(
                            "==END=="
                        )[0]

                    final_recovered_log_file_handle.writelines(lines)
                    number_of_first_recovered_log_files += 1

                    # Try and get the file name of the next log file
                    # If the next file is not found, then the first log file is the only log file for this set of logs
                    if last_line.startswith("==NEXT_FILE=="):
                        next_log_file_name = self.__getNextLogFilePath(last_line)
                        next_log_file = self.log_directory.joinpath(next_log_file_name)

                        # If the next file is not found or doesn't exist in the list of log files, or if the file isn't a file, then stop the recovery
                        if (
                            not next_log_file
                            or next_log_file not in log_files
                            or not next_log_file.is_file()
                        ):
                            print(
                                f"Could not find the next log file {next_log_file_name}, stopping recovery"
                            )
                            no_next_log_file_flag = True
                    else:
                        no_next_log_file_flag = True

            os.remove(first_recovered_log_file)

            if no_next_log_file_flag:
                continue

            # Go through each log file listed in the end of the previous log file whilst appending the messages to the final log file
            while next_log_file is not None:
                with open(
                    final_recovered_log_file, "a"
                ) as final_recovered_log_file_handle:
                    with open(next_log_file) as next_log_file_handle:
                        lines = next_log_file_handle.readlines()
                        final_recovered_log_file_handle.writelines(lines)
                        number_of_first_recovered_log_files += 1
                        last_line = lines[-1]

                        current_log_file = next_log_file

                        # Try and get the file name of the next log file
                        if last_line.startswith("==NEXT_FILE=="):
                            next_log_file_name = self.__getNextLogFilePath(last_line)
                            next_log_file = self.log_directory.joinpath(
                                next_log_file_name
                            )

                            # If the next file is not found or doesn't exist in the list of log files, or if the file isn't a file, then stop the recovery
                            if (
                                not next_log_file
                                or next_log_file not in log_files
                                or not next_log_file.is_file()
                            ):
                                print(
                                    f"Could not find the next log file {next_log_file_name}, stopping recovery"
                                )
                                next_log_file = None
                        else:
                            next_log_file = None

                    # Remove the current log file as we're done reading from it
                    os.remove(current_log_file)

            if exif_date is not None:
                print(
                    f"Recovered logs {number_of_first_recovered_log_files} from {exif_date}"
                )
                new_final_recovered_log_file_name = self.log_directory.joinpath(
                    f"{exif_date}_RECOVERED.ftlog"
                )
                os.rename(
                    final_recovered_log_file,
                    new_final_recovered_log_file_name,
                )
            else:
                new_final_recovered_log_file_name = final_recovered_log_file

            print(
                f"Saved {number_of_first_recovered_log_files} recovered drone logs to: {str(new_final_recovered_log_file_name)}"
            )

    def setupDataStreams(self) -> None:
        """
        Setups up data streams for the drone.

        The data streams and the messages returned are:
        - RAW_SENSORS: RAW_IMU, SCALED_IMU2, SCALED_IMU3, SCALED_PRESSURE, SCALED_PRESSURE2
        - EXTENDED_STATUS: SYS_STATUS, POWER_STATUS, MEMINFO, NAV_CONTROLLER_OUTPUT, MISSION_CURRENT, GPS_RAW_INT, MCU_STATUS
        - RC_CHANNELS: SERVO_OUTPUT_RAW, RC_CHANNELS
        - POSITION: LOCAL_POSITION, GLOBAL_POSITION_INT
        - EXTRA1: ESC_TELEMETRY_5_TO_8, ATTITUDE
        - EXTRA2: VFR_HUD
        - EXTRA3: BATTERY_STATUS, SYSTEM_TIME, VIBRATION, AHRS, WIND, TERRAIN_REPORT, EKF_STATUS_REPORT
        """

        # self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS)
        self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS)
        # self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS)
        self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_POSITION)
        self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1)
        self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2)
        self.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA3)

    def setupSingleDataStream(self, stream: int) -> None:
        """Set up a single data stream.

        Args:
            stream (int): The data stream to set up
        """
        if self.wireless:
            self.sendDataStreamRequestMessage(stream, DATASTREAM_RATES_WIRELESS[stream])
        else:
            self.sendDataStreamRequestMessage(stream, DATASTREAM_RATES_WIRED[stream])

    def sendDataStreamRequestMessage(self, stream: int, rate: int) -> None:
        """Send a request for a specific data stream.

        Args:
            stream (int): The data stream to request
            rate (int): The rate, in hertz, to receive the data stream
        """
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            stream,
            rate,
            1,
        )

    def stopAllDataStreams(self) -> None:
        """Stop all data streams"""
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_ALL,
            1,
            0,
        )

    def addMessageListener(
        self, message_id: int, func: Optional[Callable] = None
    ) -> bool:
        """Add a message listener for a specific message.

        Args:
            message_id (int): The message to add a listener for.
            func (Optional[Callable], optional): The function to run when the message is received. Defaults to None.

        Returns:
            bool: True if the listener was added, False if it already exists
        """
        if message_id not in self.message_listeners:
            self.message_listeners[message_id] = func
            return True
        return False

    def removeMessageListener(self, message_id: int) -> bool:
        """Removes a message listener for a specific message.

        Args:
            message_id (int): The message to remove the listener for.

        Returns:
            bool: True if the listener was removed, False if it does not exist
        """
        if message_id in self.message_listeners:
            del self.message_listeners[message_id]
            return True
        return False

    def checkForMessages(self) -> None:
        """Check for messages from the drone and add them to the message queue."""
        while self.is_active:
            if not self.is_listening:
                continue

            try:
                msg = self.master.recv_msg()
            except mavutil.mavlink.MAVError as e:
                print("mav recv error: %s" % str(e))
                if self.droneErrorCb:
                    self.droneErrorCb(str(e))
                continue
            except AttributeError as e:
                print(f"mav recv error: {e}")
            except KeyboardInterrupt:
                break
            except serial.serialutil.SerialException as e:
                print("Autopilot disconnected")
                print(str(e))
                if self.droneDisconnectCb:
                    self.droneDisconnectCb()
                self.is_listening = False
                self.is_active = False
                break
            except Exception as e:
                # Log any other unexpected exception
                print(traceback.format_exc())
                if self.droneErrorCb:
                    self.droneErrorCb(str(e))
                continue

            if msg:
                if msg.msgname == "HEARTBEAT":
                    if (
                        msg.autopilot == mavutil.mavlink.MAV_AUTOPILOT_INVALID
                    ):  # No valid autopilot, e.g. a GCS or other MAVLink component
                        continue

                    self.armed = bool(
                        msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
                    )

                if self.armed:
                    try:
                        self.log_message_queue.put(
                            f"{msg._timestamp},{msg.msgname},{','.join([f'{message}:{msg.to_dict()[message]}' for message in msg.to_dict() if message != 'mavpackettype'])}"
                        )
                    except Exception as e:
                        self.log_message_queue.put(f"Writing message failed! {e}")
                        continue

                if msg.msgname == "TIMESYNC":
                    component_timestamp = msg.ts1
                    local_timestamp = time.time_ns()
                    self.master.mav.timesync_send(local_timestamp, component_timestamp)
                    continue
                elif msg.msgname == "STATUSTEXT":
                    print(msg.text)
                else:
                    print(msg.msgname)
                    if msg.msgname == "COMMAND_LONG" or msg.msgname == "PARAM_VALUE":
                        print(msg.to_dict())

                # TODO: maybe move PARAM_VALUE message receive logic into getAllParams

                if self.is_requesting_params and msg.msgname != "PARAM_VALUE":
                    continue

                if self.is_requesting_params and msg.msgname == "PARAM_VALUE":
                    self.saveParam(msg.param_id, msg.param_value, msg.param_type)

                    self.current_param_index = msg.param_index

                    if self.total_number_of_params != msg.param_count:
                        self.total_number_of_params = msg.param_count

                    if msg.param_index == msg.param_count - 1:
                        self.is_requesting_params = False
                        self.current_param_index = 0
                        self.total_number_of_params = 0
                        self.params = sorted(self.params, key=lambda k: k["param_id"])

                if msg.msgname in self.message_listeners:
                    self.message_queue.put([msg.msgname, msg])

    def executeMessages(self) -> None:
        """Executes message listeners based on messages from the message queue."""
        while self.is_active:
            try:
                q = self.message_queue.get()
                self.message_listeners[q[0]](q[1])
            except KeyError as e:
                print(
                    f"Could not execute message (likely due to backend abruptly stopping): {e}"
                )

    def logMessages(self) -> None:
        """A thread to log messages into a temp FTLog file from the log queue."""
        current_line_number = 0

        while self.is_active:
            log_msg = self.log_message_queue.get()
            if log_msg:
                # Check if a temp log file has been created yet, if not create one
                if self.current_log_file is None:
                    self.current_log_file = self.log_directory.joinpath(
                        f"tmp_first_{token_hex(8)}.ftlog"
                    )
                    self.log_file_names.append(self.current_log_file)
                    with open(self.current_log_file, "w") as f:
                        f.write(
                            f"==START_TIME=={self.__getCurrentDateTimeStr()}==END==\n"
                        )

                # Write the incoming telemetry message to the temp log file
                if current_line_number < LOG_LINE_LIMIT:
                    with open(self.current_log_file, "a") as current_log_file_handler:
                        current_log_file_handler.write(log_msg + "\n")
                        current_line_number += 1
                else:
                    # If the current log file has reached the line limit, create a new temp log file
                    next_log_file_name = self.log_directory.joinpath(
                        f"tmp_{token_hex(8)}.ftlog"
                    )
                    with open(self.current_log_file, "a") as current_log_file_handler:
                        # Write the next file name to the current log file
                        current_log_file_handler.write(
                            f"==NEXT_FILE=={str(next_log_file_name)}==END==\n"
                        )

                    self.current_log_file = next_log_file_name
                    self.log_file_names.append(self.current_log_file)

                    with open(self.current_log_file, "w") as f:
                        f.write(
                            f"==START_TIME=={self.__getCurrentDateTimeStr()}==END==\n"
                        )
                        f.write(log_msg + "\n")
                        current_line_number = 1

    def startThread(self) -> None:
        """Starts the listener and sender threads."""
        self.listener_thread = Thread(target=self.checkForMessages, daemon=True)
        self.sender_thread = Thread(target=self.executeMessages, daemon=True)
        self.log_thread = Thread(target=self.logMessages, daemon=True)
        self.listener_thread.start()
        self.sender_thread.start()
        self.log_thread.start()

    def getSingleParam(
        self, param_name: str, timeout: Optional[int] = 1.5
    ) -> Union[Response, ResponseWithData]:
        """Gets a specific parameter value.

        Args:
            param_name (str): The name of the parameter to get
            timeout (int, optional): The time to wait before failing to return the parameter. Defaults to 1 second.

        Returns:
            Response: The response from the retrieval of the specific parameter
        """
        self.is_listening = False
        failure_message = f"Failed to get parameter {param_name}"

        self.master.mav.param_request_read_send(
            self.target_system, self.target_component, param_name.encode(), -1
        )

        while True:
            try:
                response = self.master.recv_match(
                    type="PARAM_VALUE", blocking=True, timeout=timeout
                )
                if response and response.param_id == param_name:
                    self.is_listening = True
                    return {
                        "success": True,
                        "data": response,
                    }
                else:
                    print(response)
                    self.is_listening = True
                    return {
                        "success": False,
                        "message": failure_message,
                    }

            except serial.serialutil.SerialException:
                self.is_listening = True
                return {
                    "success": False,
                    "message": f"{failure_message}, serial exception",
                }

    def getAllParams(self) -> None:
        """Request all parameters from the drone."""
        self.stopAllDataStreams()

        self.master.param_fetch_all()
        self.is_requesting_params = True

    def setMultipleParams(self, params_list: list[IncomingParam]) -> bool:
        """Sets multiple parameters on the drone.

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
        """Sets a single parameter on the drone.

        Args:
            param_name (str): The name of the parameter to set
            param_value (Number): The value to set the parameter to
            param_type (int): The type of the parameter
            retries (int, optional): The number of times a parameter will be attempted to be set. Defaults to 3.

        Returns:
            bool: True if the parameter was set, False if it failed
        """
        self.is_listening = False
        got_ack = False

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
                    print("can't send %s of type %u" % (param_name, param_type))
                    self.is_listening = True
                    return False
                # vfloat, = struct.unpack(">f", vstr)
            vfloat = float(param_value)
        except struct.error as e:
            print(f"Could not set parameter {param_name} with value {param_value}: {e}")
            self.is_listening = True
            return False

        while retries > 0 and not got_ack:
            retries -= 1
            self.master.param_set_send(param_name.upper(), vfloat, parm_type=param_type)
            tstart = time.time()
            while time.time() - tstart < 2:
                ack = self.master.recv_match(type="PARAM_VALUE")
                if ack is None:
                    time.sleep(0.1)
                    continue
                if str(param_name).upper() == str(ack.param_id).upper():
                    got_ack = True
                    print(
                        f"Got parameter saving ack for {param_name} for value {param_value}"
                    )
                    self.saveParam(ack.param_id, ack.param_value, ack.param_type)
                    break

        if not got_ack:
            print(f"timeout setting {param_name} to {vfloat}")
            self.is_listening = True
            return False

        self.is_listening = True
        return True

    def saveParam(self, param_name: str, param_value: Number, param_type: int) -> None:
        """Save a parameter to the params list.

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

    def rebootAutopilot(self) -> None:
        """Reboot the autopilot."""
        self.is_listening = False
        self.sendCommand(
            mavutil.mavlink.MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN,
            param1=1,  #  Autpilot
            param2=0,  #  Companion
            param3=0,  # Component action
            param4=0,  # Component ID
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(
                response, mavutil.mavlink.MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN
            ):
                print("Rebooting")
                self.close()
            else:
                print("Reboot failed")
                self.is_listening = True
        except serial.serialutil.SerialException:
            print("Rebooting")
            self.close()

    def arm(self, force: bool = False) -> Response:
        """Arm the drone.

        Args:
            force (bool, optional): Option to force arm the drone. Defaults to False.

        Returns:
            Response: The response from the arm command
        """
        if self.armed:
            return {"success": False, "message": "Already armed"}

        self.is_listening = False

        self.sendCommand(
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            param1=1,  # 0=disarm, 1=arm
            param2=2989 if force else 0,  # force arm/disarm
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM):
                print("Waiting for arm")
                while not self.armed:
                    time.sleep(0.05)
                print("ARMED")
                return {"success": True, "message": "Armed successfully"}
            else:
                print("Arming failed")
        except Exception as e:
            print(traceback.format_exc())
            if self.droneErrorCb:
                self.droneErrorCb(str(e))
                return {"success": False, "message": "Could not arm"}

        return {"success": False, "message": "Could not arm"}

    def disarm(self, force: bool = False) -> Response:
        """Disarm the drone.

        Args:
            force (bool, optional): Option to force disarm the drone. Defaults to False.

        Returns:
            Response: The response from the disarm command
        """
        if not self.armed:
            return {"success": False, "message": "Already disarmed"}

        self.is_listening = False

        self.sendCommand(
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            param1=0,  # 0=disarm, 1=arm
            param2=2989 if force else 0,  # force arm/disarm
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM):
                print("Waiting for disarm")
                while self.armed:
                    time.sleep(0.05)
                print("DISARMED")
                return {"success": True, "message": "Disarmed successfully"}
            else:
                print("Disarming failed")
        except Exception as e:
            print(traceback.format_exc())
            if self.droneErrorCb:
                self.droneErrorCb(str(e))
                return {"success": False, "message": "Could not disarm"}

        return {"success": False, "message": "Could not disarm"}

    def checkMotorTestValues(
        self, data: MotorTestThrottleAndDuration
    ) -> tuple[int, int, Optional[str]]:
        """Check the values for a motor test.

        Args:
            data (MotorTestThrottleAndDuration): The data to check

        Returns:
            tuple[int, int, Optional[str]]: The throttle, duration, and error message if it exists
        """
        throttle = data.get("throttle", -1)
        if 0 > throttle > 100:
            return 0, 0, "Invalid value for throttle"

        duration = data.get("duration", -1)
        if duration < 0:
            return 0, 0, "Invalid value for duration"

        return throttle, duration, None

    def testOneMotor(self, data: MotorTestAllValues) -> Response:
        """Test a single motor.

        Args:
            data (MotorTestAllValues): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        self.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        motor_instance = data.get("motorInstance")

        self.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            param1=motor_instance,  # ID of the motor to be tested
            param2=0,  # throttle type (PWM,% etc)
            param3=throttle,  # value of the throttle - 0 to 100%
            param4=duration,  # duration of the test in seconds
            param5=0,  # number of motors to test in a sequence
            param6=0,  # test order
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                return {
                    "success": True,
                    "message": f"Motor test started for motor {motor_instance}",
                }
            else:
                return {
                    "success": False,
                    "message": f"Motor test for motor {motor_instance} not started",
                }
        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": f"Motor test for motor {motor_instance} not started, serial exception",
            }

    def testMotorSequence(self, data: MotorTestThrottleAndDuration) -> Response:
        """Test a sequence of motors.

        Args:
            data (MotorTestThrottleAndDuration): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        self.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        self.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            param1=0,  # ID of the motor to be tested
            param2=0,  # throttle type (PWM,% etc)
            param3=throttle,  # value of the throttle - 0 to 100%
            param4=duration,  # delay between tests in seconds
            param5=self.number_of_motors + 1,  # number of motors to test in a sequence
            param6=0,  # test order
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                return {"success": True, "message": "Motor sequence test started"}
            else:
                return {"success": False, "message": "Motor sequence test not started"}

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Motor sequence test not started, serial exception",
            }

    def testAllMotors(self, data: MotorTestThrottleAndDuration) -> Response:
        """Test all motors.

        Args:
            data (MotorTestThrottleAndDuration): The data for the motor test

        Returns:
            Response: The response from the motor test
        """
        # Timeout after 3 seconds waiting for the motor test confirmation
        RESPONSE_TIMEOUT = 3

        self.is_listening = False

        throttle, duration, err = self.checkMotorTestValues(data)
        if err:
            return {"success": False, "message": err}

        for idx in range(1, self.number_of_motors):
            self.sendCommand(
                mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                param1=idx,  # ID of the motor to be tested
                param2=0,  # throttle type (PWM,% etc)
                param3=throttle,  # value of the throttle - 0 to 100%
                param4=duration,  # duration of the test in seconds
                param5=0,  # number of motors to test in a sequence
                param6=0,  # test order
            )

        responses = 0
        now = time.gmtime()

        while True:
            try:
                response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

                if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                    responses += 1
                    if responses == self.number_of_motors:
                        return {"success": True, "message": "All motor test started"}

                else:
                    return {"success": False, "message": "All motor test not started"}

                if time.gmtime().tm_sec - now.tm_sec > RESPONSE_TIMEOUT:
                    return {
                        "success": False,
                        "message": "All motor test not started, timed out",
                    }

            except serial.serialutil.SerialException:
                return {
                    "success": False,
                    "message": "All motor test not started, serial exception",
                }

    def setServo(self, servo_instance: int, pwm_value: int) -> Response:
        """Set a servo to a specific PWM value.

        Args:
            servo_instance (int): The number of the servo to set
            pwm_value (int): The PWM value to set the servo to

        Returns:
            Response: The response from the servo set command
        """
        self.is_listening = False

        self.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
            param1=servo_instance,  # Servo instance number
            param2=pwm_value,  # PWM value
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_SET_SERVO):
                return {"success": True, "message": f"Setting servo to {pwm_value}"}

            else:
                return {"success": False, "message": "Setting servo failed"}

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Setting servo failed, serial exception",
            }

    def setGripper(self, action: str) -> Response:
        """Set the gripper to a specific action.

        Args:
            action (str): The action to set the gripper to, either "release" or "grab"

        Returns:
            Response: The response from the gripper set command
        """
        self.is_listening = False

        return self.gripper.setGripper(action)

    def calibrateAccelerometer(self):
        self.is_listening = False

        consts = {
            1: "ACCELCAL_VEHICLE_POS_LEVEL	",
            2: "ACCELCAL_VEHICLE_POS_LEFT	",
            3: "ACCELCAL_VEHICLE_POS_RIGHT	",
            4: "ACCELCAL_VEHICLE_POS_NOSEDOWN	",
            5: "ACCELCAL_VEHICLE_POS_NOSEUP	",
            6: "ACCELCAL_VEHICLE_POS_BACK	",
            16777215: "ACCELCAL_VEHICLE_POS_SUCCESS	",
            16777216: "ACCELCAL_VEHICLE_POS_FAILED",
        }

        self.sendCommand(mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION, param5=1)

        command_accepted = False
        params = {}

        try:
            while True:
                response = self.master.recv_match(
                    type=["COMMAND_ACK", "PARAM_VALUE", "COMMAND_LONG"], blocking=True
                )

                if response.msgname == "COMMAND_ACK" and commandAccepted(
                    response, mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION
                ):
                    command_accepted = True
                    print("accepted")
                elif response.msgname == "PARAM_VALUE":
                    params[response.param_id] = response.param_value
                    print(response.param_id, response.param_value)
                elif (
                    response.msgname == "COMMAND_LONG"
                    and response.command == mavutil.mavlink.MAV_CMD_ACCELCAL_VEHICLE_POS
                ):
                    print(f"Current position: {consts[response.param1]}")
                    if command_accepted:
                        if response.param1 == 16777215:
                            print("Calibration successful")
                            break
                        elif response.param1 == 16777216:
                            print("Calibration failed")
                            break
                        elif response.param1 == 1:
                            self.sendCommand(
                                mavutil.mavlink.MAV_CMD_ACCELCAL_VEHICLE_POS,
                                param1=1,
                            )

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Setting servo failed, serial exception",
            }

    def sendCommand(
        self,
        message: int,
        param1=0,
        param2=0,
        param3=0,
        param4=0,
        param5=0,
        param6=0,
        param7=0,
    ) -> None:
        """Send a command to the drone.

        Args:
            message (int): The message to send
            param1 (int, optional)
            param2 (int, optional)
            param3 (int, optional)
            param4 (int, optional)
            param5 (int, optional)
            param6 (int, optional)
            param7 (int, optional)
        """
        message = self.master.mav.command_long_encode(
            self.target_system,
            self.target_component,
            message,
            0,  # Confirmation
            param1,  # param 1
            param2,  # param 2
            param3,  # param 3
            param4,  # param 4
            param5,  # param 5
            param6,  # param 6
            param7,  # param 7
        )
        self.master.mav.send(message)

    def close(self) -> None:
        """Close the connection to the drone."""
        for message_id in copy.deepcopy(self.message_listeners):
            self.removeMessageListener(message_id)

        self.stopAllDataStreams()
        self.is_active = False
        self.master.close()

        final_log_file = self.log_directory.joinpath(
            f"{self.__getCurrentDateTimeStr()}.ftlog"
        )

        try:
            with open(final_log_file, "a") as final_log_file_handle:
                # Open all the log files that were written to in the current session and write their data to the final log file
                for log_file in self.log_file_names:
                    if not log_file.is_file():
                        print(f"Log file {log_file} is not a file.")
                        continue

                    with open(log_file) as log_file_handle:
                        final_log_file_handle.writelines(log_file_handle.readlines())
                    os.remove(log_file)
        except Exception as e:
            print(f"Failed to save drone logs: {e}")

        print(f"Saved drone logs to: {final_log_file}")

        print("Closed connection to drone")
