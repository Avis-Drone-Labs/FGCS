import copy
import os
import struct
import time
import traceback
from queue import Queue
from threading import Thread

import serial
from pymavlink import mavutil

os.environ["MAVLINK20"] = "1"


class Drone:
    def __init__(
        self,
        port,
        baud=57600,
        wireless=False,
        droneErrorCb=None,
        droneDisconnectCb=None,
    ):
        self.port = port
        self.baud = baud
        self.wireless = wireless
        self.droneErrorCb = droneErrorCb
        self.droneDisconnectCb = droneDisconnectCb

        try:
            self.master = mavutil.mavlink_connection(port, baud=baud)
        except PermissionError as e:
            self.master = None
            self.connectionError = str(e)
            return

        self.connectionError = None

        self.master.wait_heartbeat()
        self.target_system = self.master.target_system
        self.target_component = self.master.target_component

        print(
            f"Heartbeat received (system {self.target_system} component {self.target_component})"
        )

        self.message_listeners = {}
        self.message_queue = Queue()

        self.is_active = True
        self.is_listening = True
        self.is_requesting_params = False
        self.current_param_index = 0
        self.total_number_of_params = 0
        self.params = []

        self.armed = False

        self.number_of_motors = 4  # Is there a way to get this from the drone?

        self.stopAllDataStreams()

        self.startThread()

    def setupDataStreams(self):
        """
        RAW_SENSORS: RAW_IMU, SCALED_IMU2, SCALED_IMU3, SCALED_PRESSURE, SCALED_PRESSURE2
        EXTENDED_STATUS: SYS_STATUS, POWER_STATUS, MEMINFO, NAV_CONTROLLER_OUTPUT, MISSION_CURRENT, GPS_RAW_INT, MCU_STATUS
        RC_CHANNELS: SERVO_OUTPUT_RAW, RC_CHANNELS
        POSITION: LOCAL_POSITION, GLOBAL_POSITION_INT
        EXTRA1: ESC_TELEMETRY_5_TO_8, ATTITUDE
        EXTRA2: VFR_HUD
        EXTRA3: BATTERY_STATUS, SYSTEM_TIME, VIBRATION, AHRS, WIND, TERRAIN_REPORT, EKF_STATUS_REPORT
        """
        if self.wireless:
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, 1)
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 1
            )
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 1)
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_POSITION, 1
            )
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, 4)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, 3)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA3, 1)
        else:
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, 2)
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 2
            )
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 2
            )
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_POSITION, 3
            )
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, 20
            )
            self.sendDataStreamRequestMessage(
                mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, 10
            )
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA3, 3)

    def sendDataStreamRequestMessage(self, stream, rate):
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            stream,
            rate,
            1,
        )

    def stopAllDataStreams(self):
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_ALL,
            1,
            0,
        )

    def addMessageListener(self, message_id, func=None):
        if message_id not in self.message_listeners:
            self.message_listeners[message_id] = func
            return True
        return False

    def removeMessageListener(self, message_id):
        if message_id in self.message_listeners:
            del self.message_listeners[message_id]
            return True
        return False

    def checkForMessages(self):
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

    def executeMessages(self):
        while self.is_active:
            q = self.message_queue.get()
            self.message_listeners[q[0]](q[1])

    def startThread(self):
        self.listener_thread = Thread(target=self.checkForMessages, daemon=True)
        self.sender_thread = Thread(target=self.executeMessages, daemon=True)
        self.listener_thread.start()
        self.sender_thread.start()

    def getAllParams(self):
        self.stopAllDataStreams()

        self.master.param_fetch_all()
        self.is_requesting_params = True

    def setMultipleParams(self, params_list):
        if not params_list:
            return False

        for param in params_list:
            done = self.setParam(
                param.get("param_id"), param.get("param_value"), param.get("param_type")
            )
            if not done:
                return False

        return True

    def setParam(self, param_name, param_value, param_type=None, retries=3):
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
            while time.time() - tstart < 1:
                ack = self.master.recv_match(type="PARAM_VALUE", blocking=False)
                if ack is None:
                    time.sleep(0.1)
                    continue
                if str(param_name).upper() == str(ack.param_id).upper():
                    got_ack = True
                    self.saveParam(ack.param_id, ack.param_value, ack.param_type)
                    break

        if not got_ack:
            print(f"timeout setting {param_name} to {vfloat}")
            self.is_listening = True
            return False

        self.is_listening = True
        return True

    def saveParam(self, param_name, param_value, param_type):
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

    def rebootAutopilot(self):
        self.is_listening = False
        message = self.master.mav.command_long_encode(
            self.target_system,  # Target system ID
            self.target_component,  # Target component ID
            mavutil.mavlink.MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN,  # ID of command to send
            0,  # Confirmation
            1,  # param1: Autpilot
            0,  # param2: Companion
            0,  # param3 Component action
            0,  # param4 Component ID
            0,  # param5 (unused)
            0,  # param5 (unused)
            0,  # param6 (unused)
        )

        self.master.mav.send(message)

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if self.commandAccepted(
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

    def arm(self, force=False):
        if self.armed:
            return {"success": False, "message": "Already armed"}

        self.is_listening = False

        self.master.mav.command_long_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            0,
            1,
            2989 if force else 0,
            0,
            0,
            0,
            0,
            0,
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.is_listening = True

            if self.commandAccepted(
                response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM
            ):
                print("Waiting for arm")
                while not self.armed:
                    time.sleep(0.05)
                print("ARMED")
                return {"success": True, "message": "Armed successfully"}
            else:
                print("Arming failed")
        except Exception as e:
            print(traceback.format_exc())
            self.droneErrorCb(str(e))
        # finally:
        # self.is_listening = True

        return {"success": False, "message": "Could not arm"}

    def disarm(self, force=False):
        if not self.armed:
            return {"success": False, "message": "Already disarmed"}

        self.is_listening = False

        self.master.mav.command_long_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            0,
            1,
            2989 if force else 0,
            0,
            0,
            0,
            0,
            0,
        )

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.is_listening = True

            if self.commandAccepted(
                response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM
            ):
                print("Waiting for disarm")
                while self.armed:
                    time.sleep(0.05)
                # self.master.motors_disarmed_wait()
                print("DISARMED")
                return {"success": True, "message": "Disarmed successfully"}
            else:
                print("Disarming failed")
        except Exception as e:
            print(traceback.format_exc())
            self.droneErrorCb(str(e))
        # finally:
        #     self.is_listening = True

        return {"success": False, "message": "Could not disarm"}

    def testOneMotor(self, motorInstance, throttle, duration):
        self.is_listening = False

        message = self.master.mav.command_long_encode(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            0,  # Confirmation
            motorInstance,  # ID of the motor to be tested
            0,  # throttle type (PWM,% etc)
            throttle,  # value of the throttle - 0 to 100%
            duration,  # duration of the test in seconds
            0,  # number of motors to test in a sequence
            0,  # test order
            0,  # empty
        )
        self.master.mav.send(message)
        success = True

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if self.commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                print("Motor Test Started")
            else:
                print("Motor test not started")
                success = False
        except serial.serialutil.SerialException:
            print("Motor test not started")
            success = False

        return success

    def testMotorSequence(self, throttle, delay):
        self.is_listening = False

        message = self.master.mav.command_long_encode(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
            0,  # Confirmation
            0,  # ID of the motor to be tested
            0,  # throttle type (PWM,% etc)
            throttle,  # value of the throttle - 0 to 100%
            delay,  # duration of the test in seconds
            self.number_of_motors + 1,  # number of motors to test in a sequence
            0,  # test order
            0,  # empty
        )
        self.master.mav.send(message)
        success = True

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if self.commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST):
                print("Motor Test Started")
            else:
                print("Motor test not started")
                success = False
        except serial.serialutil.SerialException:
            print("Motor test not started")
            success = False

        return success

    def doActuatorTest(
        self, act1=None, act2=None, act3=None, act4=None, act5=None, act6=None, index=0
    ):
        self.is_listening = False

        message = self.master.mav.command_long_encode(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_CMD_DO_SET_ACTUATOR,
            0,  # Confirmation
            act1,  # Actuator 1 value, scaled from [-1 to 1]. NaN to ignore
            act2,  # Actuator 2 value, scaled from [-1 to 1]. NaN to ignore
            act3,  # Actuator 3 value, scaled from [-1 to 1]. NaN to ignore
            act4,  # Actuator 4 value, scaled from [-1 to 1]. NaN to ignore
            act5,  # Actuator 5 value, scaled from [-1 to 1]. NaN to ignore
            act6,  # Actuator 6 value, scaled from [-1 to 1]. NaN to ignore
            index,  # Index of actuator set (i.e if set to 1, Actuator 1 becomes Actuator 7)
        )
        self.master.mav.send(message)
        success = True

        try:
            response = self.master.recv_match(type="COMMAND_ACK", blocking=True)

            if self.commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_SET_ACTUATOR):
                print("Setting actuators")
            else:
                print("Setting actuators failed")
                success = False
        except serial.serialutil.SerialException:
            print("Setting actuators failed, serial exception")
            success = False

        return success

    def commandAccepted(self, response, command):
        return (
            response
            and response.command == command
            and response.result == mavutil.mavlink.MAV_RESULT_ACCEPTED
        )

    def close(self):
        for message_id in copy.deepcopy(self.message_listeners):
            self.removeMessageListener(message_id)

        self.stopAllDataStreams()

        self.is_active = False

        self.master.close()

        print("Closed connection to drone")
