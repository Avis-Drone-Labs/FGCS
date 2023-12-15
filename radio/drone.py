import copy
import traceback
from threading import Thread
from queue import Queue

from pymavlink import mavutil


class Drone:
    def __init__(self, port):
        self.master = mavutil.mavlink_connection(port, baud=57600)
        self.master.wait_heartbeat()
        self.target_system = self.master.target_system
        self.target_component = self.master.target_component

        print(
            f"Heartbeat received (system {self.target_system} component {self.target_component})"
        )

        self.message_listeners = {}
        self.message_queue = Queue()
        self.is_active = True

        self.startThread()
        self.setupDataStreams()

    def setupDataStreams(self):
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_EXTRA1,
            5,
            1,
        )  # ESC_TELEMETRY_5_TO_8, ATTITUDE
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_EXTRA2,
            5,
            1,
        )  # VFR_HUD
        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_EXTRA3,
            5,
            1,
        )  # BATTERY_STATUS, SYSTEM_TIME, VIBRATION, AHRS, WIND, TERRAIN_REPORT, EKF_STATUS_REPORT

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
        while True:
            if not self.is_active:
                break

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
                if msg.msgname in self.message_listeners:
                    self.message_queue.put([msg.msgname, msg])

    def executeMessages(self):
        while True:
            q = self.message_queue.get()
            self.message_listeners[q[0]](q[1])

    def startThread(self):
        self.listener_thread = Thread(target=self.checkForMessages, daemon=True)
        self.sender_thread = Thread(target=self.executeMessages, daemon=True)
        self.listener_thread.start()
        self.sender_thread.start()

    def close(self):
        self.is_active = False
        for message_id in copy.deepcopy(self.message_listeners):
            self.removeMessageListener(message_id)

        self.master.mav.request_data_stream_send(
            self.target_system,
            self.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_ALL,
            1,
            0,
        )

        self.master.close()

        print("Closed connection to drone")
