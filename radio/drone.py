import copy
import os
import struct
import time
import traceback
from pathlib import Path
from queue import Queue
from threading import Thread
from typing import Callable, Optional

import serial
from customTypes import (
    IncomingParam,
    MotorTestAllValues,
    MotorTestThrottleAndDuration,
    Number,
    Response,
)
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
        self.current_log_file = 1
        self.cleanTempLogs()

        self.is_active = True
        self.is_listening = True
        self.is_requesting_params = False
        self.current_param_index = 0
        self.total_number_of_params = 0
        self.number_of_motors = 4  # Is there a way to get this from the drone?
        self.params = []

        self.armed = False

        self.gripper = Gripper(self.master, self.target_system, self.target_component)
        self.mission = Mission(self)
        self.stopAllDataStreams()
        self.startThread()

    def cleanTempLogs(self) -> None:
        """
        Cleans and attempts to recover old log files by using the ==EXIF==...==END== at the top of the firs temp log file.
        If there are others then add them to the recovered file. Once everything has been read, delete all old temp logs.
        """
        log_files = [file for file in os.listdir(self.log_directory) if file.startswith("tmp")]
        final_log_file = f"RECOVERED_TMP_{time.strftime('%Y-%m-%d_%H-%M-%S', time.localtime())}.ftlog"

        # Attempt to get first temp log file's date
        try:
            with open(f"{self.log_directory}/tmp1.ftlog") as f:
                first_line = f.readline()
                if first_line.startswith("==EXIF=="):
                    final_log_file = f'{first_line.split("==EXIF==")[-1].split("==END==")[0]}.ftlog'
        except Exception as _:
            print(f"Exif data not found, moving temp files into '{final_log_file}'")

        # Combine Logs 
        try:
            if len(log_files) > 0:
                final_log_file = self.log_directory.joinpath(final_log_file)
                with open(final_log_file, "a") as f:
                    for temp_file_number in log_files:
                        temp_filename = str(self.log_directory.joinpath(temp_file_number))
                        with open(temp_filename) as temp_f:
                            f.writelines(temp_f.readlines())
                        os.remove(temp_filename)
                print(f"Saved drone logs to: {final_log_file}")
        except Exception as e:
            print(f"Failed to save drone logs: {e}")

                
                


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

                if msg.msgname == "STATUSTEXT":
                    print(msg.text)
                elif msg.msgname == "HEARTBEAT":
                    if (
                        msg.autopilot == mavutil.mavlink.MAV_AUTOPILOT_INVALID
                    ):  # No valid autopilot, e.g. a GCS or other MAVLink component
                        continue

                    self.armed = bool(
                        msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
                    )
                elif msg.msgname == "PARAM_VALUE":
                    print(msg.param_id)
                else:
                    print(msg.msgname)

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
                print(f"Could not execute message (likely due to backend abruptly stopping): {e}")

    def logMessages(self) -> None:
        """A thread to log messages into a FTLog file from the log queue."""
        current_lines = 0
        while self.is_active:
            if not self.log_message_queue.empty():
                file_dir = str(
                    self.log_directory.joinpath(f"tmp{self.current_log_file}.ftlog")
                )

                # Write the date at time on the first log message for recovery
                if not os.path.exists(file_dir):
                    with open(file_dir, "w") as f:
                        f.write(f"==EXIF=={time.strftime('%Y-%m-%d_%H-%M-%S', time.localtime())}==END==\n")

                # Attempt to log the messages into the current file
                with open(file_dir, "a") as f:
                    if current_lines < LOG_LINE_LIMIT:
                        f.write(self.log_message_queue.get() + "\n")
                        current_lines += 1
                    else:
                        self.current_log_file += 1
                        current_lines = 0

    def startThread(self) -> None:
        """Starts the listener and sender threads."""
        self.listener_thread = Thread(target=self.checkForMessages, daemon=True)
        self.sender_thread = Thread(target=self.executeMessages, daemon=True)
        self.log_thread = Thread(target=self.logMessages, daemon=True)
        self.listener_thread.start()
        self.sender_thread.start()
        self.log_thread.start()

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

        # Wait for queue to be empty
        while not self.message_queue.empty():
            time.sleep(0.1)

        final_log_file = str(
            self.log_directory.joinpath(
                f"{time.strftime('%Y-%m-%d_%H-%M-%S', time.localtime())}.ftlog"
            )
        )

        # Ensure log file is a real file/directory
        if not os.path.exists(final_log_file):
            print("Log file directory wasn't made, making it now...")
            os.makedirs(os.path.dirname(final_log_file), exist_ok=True)

        # Combine Logs 
        try:
            with open(final_log_file, "a") as f:
                for file_num in range(1, self.current_log_file + 1):
                    temp_filename = str(self.log_directory.joinpath(f"tmp{file_num}.ftlog"))
                    with open(temp_filename) as temp_f:
                        f.writelines(temp_f.readlines())
                    os.remove(temp_filename)
            print(f"Saved drone logs to: {final_log_file}")
        except Exception as e:
            print(f"Failed to save drone logs: {e}")

        print("Closed connection to drone")
