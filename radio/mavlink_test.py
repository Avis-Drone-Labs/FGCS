import time

from pymavlink import mavutil
from utils import getComPort
from drone import Drone

# from influxdb_client import InfluxDBClient, Point
# from influxdb_client.client.write_api import SYNCHRONOUS

# token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

# org = "Project Falcon"
# url = "http://localhost:8086"
# bucket = "telemetry"

# db_client = InfluxDBClient(url=url, token=token, org=org)
# write_api = db_client.write_api(write_options=SYNCHRONOUS)


def sys_status_cb(msg):
    print(msg.id)
    # point = (
    #     Point("sys_status")
    #     .field("voltage_battery", msg.voltage_battery / 1000)
    #     .field("current_battery", msg.current_battery / 100)
    #     .field("battery_remaining", msg.battery_remaining)
    # )
    # write_api.write(bucket=bucket, org="Project Falcon", record=point)


def attitude_cb(msg):
    print(msg.id)
    # point = (
    #     Point("attitude")
    #     .field("pitch", msg.pitch)
    #     .field("roll", msg.roll)
    #     .field("yaw", msg.yaw)
    # )
    # write_api.write(bucket=bucket, org="Project Falcon", record=point)


def gps_raw_int_cb(msg):
    print(msg.id)
    # point = (
    #     Point("gps_raw_int")
    #     .field("lat", msg.lat)
    #     .field("lon", msg.lon)
    #     .field("satellites_visible", msg.satellites_visible)
    # )
    # write_api.write(bucket=bucket, org="Project Falcon", record=point)


def vfr_hud_cb(msg):
    print(msg.id)
    # point = (
    #     Point("vfr_hud")
    #     .field("airspeed", msg.airspeed)
    #     .field("groundspeed", msg.groundspeed)
    #     .field("heading", msg.heading)
    #     .field("throttle", msg.throttle)
    #     .field("altitude", msg.alt)
    # )
    # write_api.write(bucket=bucket, org="Project Falcon", record=point)


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

    # write_api.close()
    # db_client.close()
