import copy
import traceback
from threading import Thread

from pymavlink import mavutil
from utils import secondsToMicroseconds

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

        self.is_active = True

        self.startThread()

    def addMessageListener(self, message_id, func=None, interval=1):
        if message_id not in self.message_listeners:
            message = self.master.mav.command_long_encode(
                self.target_system,  # Target system ID
                self.target_component,  # Target component ID
                mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL,  # ID of command to send
                0,  # Confirmation
                message_id,  # param1: Message ID to be streamed
                secondsToMicroseconds(interval),  # param2: Interval in microseconds
                0,  # param3 (unused)
                0,  # param4 (unused)
                0,  # param5 (unused)
                0,  # param5 (unused)
                0,  # param6 (unused)
            )

            self.master.mav.send(message)

            # response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            # if (
            #     response
            #     and response.command == mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL
            #     and response.result == mavutil.mavlink.MAV_RESULT_ACCEPTED
            # ):
            self.message_listeners[message_id] = func
            return True
        return False

    def removeMessageListener(self, message_id):
        if message_id in self.message_listeners:
            message = self.master.mav.command_long_encode(
                self.target_system,  # Target system ID
                self.target_component,  # Target component ID
                mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL,  # ID of command to send
                0,  # Confirmation
                message_id,  # param1: Message ID to be streamed
                -1,  # param2: -1 to disable stream
                0,  # param3 (unused)
                0,  # param4 (unused)
                0,  # param5 (unused)
                0,  # param5 (unused)
                0,  # param6 (unused)
            )

            self.master.mav.send(message)

            # response = self.master.recv_match(type="COMMAND_ACK", blocking=True)
            # if (
            #     response
            #     and response.command == mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL
            #     and response.result == mavutil.mavlink.MAV_RESULT_ACCEPTED
            # ):
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
                if self.message_listeners.get(msg.id):
                    self.message_listeners[msg.id](msg)
                # else:
                # print(msg)

    def startThread(self):
        self.listener_thread = Thread(target=self.checkForMessages, daemon=True)
        self.listener_thread.start()
        # self.listener_thread.join()

    def close(self):
        self.is_active = False
        for message_id in copy.deepcopy(self.message_listeners):
            self.removeMessageListener(message_id)
        self.master.close()

        print("Closed connection to drone")