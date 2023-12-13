import copy
import time
import traceback
from threading import Thread

from pymavlink import mavutil
from utils import secondsToMicroseconds, getComPort

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

org = "Project Falcon"
url = "http://localhost:8086"
bucket = "telemetry"

db_client = InfluxDBClient(url=url, token=token, org=org)
write_api = db_client.write_api(write_options=SYNCHRONOUS)


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


def sys_status_cb(msg):
    print(msg.id)
    point = (
        Point("sys_status")
        .field("voltage_battery", msg.voltage_battery / 1000)
        .field("current_battery", msg.current_battery / 100)
        .field("battery_remaining", msg.battery_remaining)
    )
    write_api.write(bucket=bucket, org="Project Falcon", record=point)


def attitude_cb(msg):
    print(msg.id)
    point = (
        Point("attitude")
        .field("pitch", msg.pitch)
        .field("roll", msg.roll)
        .field("yaw", msg.yaw)
    )
    write_api.write(bucket=bucket, org="Project Falcon", record=point)


def gps_raw_int_cb(msg):
    print(msg.id)
    point = (
        Point("gps_raw_int")
        .field("lat", msg.lat)
        .field("lon", msg.lon)
        .field("satellites_visible", msg.satellites_visible)
    )
    write_api.write(bucket=bucket, org="Project Falcon", record=point)


def vfr_hud_cb(msg):
    print(msg.id)
    point = (
        Point("vfr_hud")
        .field("airspeed", msg.airspeed)
        .field("groundspeed", msg.groundspeed)
        .field("heading", msg.heading)
        .field("throttle", msg.throttle)
        .field("altitude", msg.alt)
    )
    write_api.write(bucket=bucket, org="Project Falcon", record=point)


def battery_status_cb(msg):
    print(msg)


def esc_status_cb(msg):
    print(msg)


if __name__ == "__main__":
    # port = "COM11"
    port = getComPort()
    drone = Drone(port)

    drone.addMessageListener(mavutil.mavlink.MAVLINK_MSG_ID_SYS_STATUS, sys_status_cb)
    drone.addMessageListener(
        mavutil.mavlink.MAVLINK_MSG_ID_ATTITUDE, attitude_cb, interval=0.25
    )
    drone.addMessageListener(mavutil.mavlink.MAVLINK_MSG_ID_GPS_RAW_INT, gps_raw_int_cb)
    drone.addMessageListener(
        mavutil.mavlink.MAVLINK_MSG_ID_VFR_HUD, vfr_hud_cb, interval=0.25
    )
    drone.addMessageListener(
        mavutil.mavlink.MAVLINK_MSG_ID_BATTERY_STATUS, battery_status_cb
    )
    drone.addMessageListener(291, esc_status_cb)

    try:
        while True:
            time.sleep(0.05)
    except KeyboardInterrupt:
        drone.close()

    write_api.close()
    db_client.close()
