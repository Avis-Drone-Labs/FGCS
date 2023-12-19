import copy
import os
import struct
import time
import traceback
from queue import Queue
from threading import Thread

from pymavlink import mavutil


os.environ['MAVLINK20'] = '1'

class Drone:
    def __init__(self, port, baud=57600, wireless=False):
        self.wireless = wireless

        self.master = mavutil.mavlink_connection(port, baud=baud)
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
        self.params = {}

        self.stopAllDataStreams()

        self.startThread()
        # self.setupDataStreams()
        # self.getAllParams()

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
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 1)
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 1)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_POSITION, 1)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, 4)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, 3)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA3, 1)
        else:
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, 2)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 2)
            # self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 2)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_POSITION, 3)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, 20)
            self.sendDataStreamRequestMessage(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, 10)
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
                msg = None
            except KeyboardInterrupt:
                break
            except Exception:
                # Log any other unexpected exception
                print(traceback.format_exc())
                msg = None
            if msg:
                print(msg.msgname)
                
                # TODO: maybe move PARAM_VALUE message receive logic into getAllParams
                
                if self.is_requesting_params and msg.msgname != 'PARAM_VALUE':
                    continue
                
                if self.is_requesting_params and msg.msgname == 'PARAM_VALUE':
                    self.saveParam(msg.param_id, msg.param_value, msg.param_type)

                    self.current_param_index = msg.param_index
                    
                    if self.total_number_of_params != msg.param_count:
                        self.total_number_of_params = msg.param_count

                    if msg.param_index == msg.param_count - 1:
                        self.is_requesting_params = False
                        self.current_param_index = 0
                        self.total_number_of_params = 0
                        self.params = dict(sorted(self.params.items()))

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
            done = self.setParam(param.get('param_name'), param.get('param_value'), param.get('param_type'))
            if not done:
                return False

        return True

    def setParam(self, param_name, param_value, param_type=None, retries=3):
        self.is_listening = False
        got_ack = False

        try:
            # Check if value fits inside the param type
            # https://github.com/ArduPilot/pymavlink/blob/4d8c4ff274d41b9bc8da1a411cb172d39786e46b/mavparm.py#L30C10-L30C10
            if param_type is not None and param_type != mavutil.mavlink.MAV_PARAM_TYPE_REAL32:
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
            print(f'Could not set parameter {param_name} with value {param_value}: {e}')
            self.is_listening = True
            return False

        while retries > 0 and not got_ack:
            retries -= 1
            self.master.param_set_send(param_name.upper(), vfloat, parm_type=param_type)
            tstart = time.time()
            while time.time() - tstart < 1:
                ack = self.master.recv_match(type='PARAM_VALUE', blocking=False)
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
        if param_name in self.params:
            self.params[param_name]['param_value'] = param_value
        else:
            self.params[param_name] = {
                'param_id': param_name,
                'param_value': param_value,
                'param_type': param_type,
            }

    def close(self):
        self.is_active = False
        for message_id in copy.deepcopy(self.message_listeners):
            self.removeMessageListener(message_id)

        self.stopAllDataStreams()

        self.master.close()

        print("Closed connection to drone")
