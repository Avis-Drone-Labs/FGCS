import copy
import os
import time
import traceback
from logging import Logger, getLogger
from pathlib import Path
from queue import Queue
from secrets import token_hex
from threading import Thread
from typing import Callable, Dict, List, Optional

import serial
from pymavlink import mavutil

from app.controllers.armController import ArmController
from app.controllers.flightModesController import FlightModesController
from app.controllers.gripperController import GripperController
from app.controllers.missionController import MissionController
from app.controllers.motorTestController import MotorTestController
from app.controllers.paramsController import ParamsController
from app.customTypes import Response
from app.utils import commandAccepted

# Constants

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
        logger: Logger = getLogger("fgcs"),
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
        self.logger = logger
        self.droneErrorCb = droneErrorCb
        self.droneDisconnectCb = droneDisconnectCb

        self.connectionError: Optional[str] = None

        self.logger.debug("Trying to setup master")
        try:
            self.master: mavutil.mavserial = mavutil.mavlink_connection(port, baud=baud)
        except PermissionError as e:
            self.logger.exception(traceback.format_exc())
            self.master = None
            self.connectionError = str(e)
            return

        initial_heartbeat = self.master.wait_heartbeat(timeout=5)
        if initial_heartbeat is None:
            self.logger.error("Heartbeat timed out after 5 seconds")
            self.mater = None
            self.connectionError = (
                "Could not connect to the drone. Perhaps try a different COM port."
            )
            return

        self.aircraft_type = initial_heartbeat.type
        self.autopilot = initial_heartbeat.autopilot
        self.target_system = self.master.target_system
        self.target_component = self.master.target_component

        self.logger.debug(
            f"Heartbeat received (system {self.target_system} component {self.target_component})"
        )

        self.message_listeners: Dict[str, Callable] = {}
        self.message_queue: Queue = Queue()
        self.log_message_queue: Queue = Queue()
        self.log_directory = Path.home().joinpath("FGCS", "logs")
        self.log_directory.mkdir(parents=True, exist_ok=True)
        self.current_log_file: Optional[Path] = None
        self.log_file_names: List[Path] = []
        self.cleanTempLogs()

        self.is_active = True

        self.number_of_motors = 4  # Is there a way to get this from the drone?

        self.armed = False

        self.paramsController = ParamsController(self)
        self.armController = ArmController(self)
        self.flightModesController = FlightModesController(self)
        self.motorTestController = MotorTestController(self)
        self.gripperController = GripperController(self)
        self.missionController = MissionController(self)

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
                            self.logger.error(
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
                                self.logger.error(
                                    f"Could not find the next log file {next_log_file_name}, stopping recovery"
                                )
                                next_log_file = None
                        else:
                            next_log_file = None

                    # Remove the current log file as we're done reading from it
                    os.remove(current_log_file)

            if exif_date is not None:
                self.logger.debug(
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

            self.logger.info(
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

    def addMessageListener(self, message_id: str, func: Callable) -> bool:
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

    def removeMessageListener(self, message_id: str) -> bool:
        """Removes a message listener for a specific message.

        Args:
            message_id (str): The message to remove the listener for.

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
                time.sleep(0.05)  # Sleep a bit to not clog up processing usage
                continue

            try:
                msg = self.master.recv_msg()
            except mavutil.mavlink.MAVError as e:
                self.logger.error(e, exc_info=True)
                if self.droneErrorCb:
                    self.droneErrorCb(str(e))
                continue
            except AttributeError as e:
                self.logger.error(e, exc_info=True)
            except KeyboardInterrupt:
                break
            except serial.serialutil.SerialException as e:
                self.logger.error("Autopilot disconnected")
                self.logger.error(e, exc_info=True)
                if self.droneDisconnectCb:
                    self.droneDisconnectCb()
                self.is_listening = False
                self.is_active = False
                break
            except Exception as e:
                # Log any other unexpected exception
                self.logger.error(e, exc_info=True)
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
                    self.logger.info(msg.text)

                # self.logger.debug(msg.msgname)

                if msg.msgname in self.message_listeners:
                    self.message_queue.put([msg.msgname, msg])

    def executeMessages(self) -> None:
        """Executes message listeners based on messages from the message queue."""
        while self.is_active:
            try:
                q = self.message_queue.get()
                self.message_listeners[q[0]](q[1])
            except KeyError as e:
                self.logger.error(
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
                self.logger.debug("Rebooting")
                self.close()
            else:
                self.logger.error("Reboot failed")
                self.is_listening = True
        except serial.serialutil.SerialException:
            self.logger.debug("Rebooting")
            self.close()

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

    def sendCommand(
        self,
        message: int,
        param1: float = 0,
        param2: float = 0,
        param3: float = 0,
        param4: float = 0,
        param5: float = 0,
        param6: float = 0,
        param7: float = 0,
    ) -> None:
        """Send a command to the drone.

        Args:
            message (float): The message to send
            param1 (float, optional)
            param2 (float, optional)
            param3 (float, optional)
            param4 (float, optional)
            param5 (float, optional)
            param6 (float, optional)
            param7 (float, optional)
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

        if len(self.log_file_names) == 0:
            self.logger.debug("No logs to save")
        elif (
            len(self.log_file_names) == 1
            and os.stat(self.log_file_names[0]).st_size <= 0
        ):
            os.remove(self.log_file_names[0])
            self.logger.debug("No logs to save")
        else:
            final_log_file = self.log_directory.joinpath(
                f"{self.__getCurrentDateTimeStr()}.ftlog"
            )

            try:
                with open(final_log_file, "a") as final_log_file_handle:
                    # Open all the log files that were written to in the current session and write their data to the final log file
                    for log_file in self.log_file_names:
                        if not log_file.is_file():
                            self.logger.warning(f"Log file {log_file} is not a file.")
                            continue

                        with open(log_file) as log_file_handle:
                            final_log_file_handle.writelines(
                                log_file_handle.readlines()
                            )
                        os.remove(log_file)
            except Exception as e:
                self.logger.error("Failed to save drone logs")
                self.logger.error(e, exc_info=True)

            self.logger.info(f"Saved drone logs to: {final_log_file}")
        self.logger.debug("Closed connection to drone")
