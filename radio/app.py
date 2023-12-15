import time

from pymavlink import mavutil
from utils import getComPort
from drone import Drone

from flask import Flask
from flask_socketio import SocketIO, emit
from mocking.telemetry_mocker import (
    mockBatteryData,
    mockEscData,
    mockGpsData,
    mockTelemetryData,
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret-key"

socketio = SocketIO(app, cors_allowed_origins="*")


@app.route("/")
def index():
    return "Hello World!"


@socketio.on("connect")
def connection():
    print("Client connected!")


@socketio.on("disconnect")
def disconnect():
    print("Client disconnected!")


@socketio.on("req_time")
def reqTime():
    emit("ret_time", int(time.time()))


@socketio.on("req_telemetry")
def reqTelemetry():
    telemetry_data = mockTelemetryData()
    emit("ret_telemetry", telemetry_data)


@socketio.on("req_esc")
def reqEsc():
    esc_data = mockEscData()
    emit("ret_esc", esc_data)


@socketio.on("get_battery")
def reqBattery():
    battery_data = mockBatteryData()
    emit("ret_battery", battery_data)


@socketio.on("get_gps")
def reqGps():
    gps_data = mockGpsData()
    emit("ret_gps", gps_data)

def sendBattery(msg):
    print("Got battery data")
    data = {
        "status": "ACTIVE",
        "voltage_battery": f"{(msg.voltage_battery / 1000):.2f}",
        "current_battery": f"{(msg.current_battery / 100):.2f}",
        "battery_remaining": msg.battery_remaining
    }
    socketio.emit("set_battery", data)
    

def sendTelemetry(msg):
    print("Got telemetry data")
    data = {
        "status": "ACTIVE",
        "airspeed": f"{msg.airspeed:.2f}",
        "groundspeed": f"{msg.groundspeed:.2f}",
        "altitude": f"{msg.alt:.2f}",
        "throttle": str(msg.throttle).zfill(2),
        "heading": str(msg.heading).zfill(2)
    }
    socketio.emit("set_telemetry", data)

def setupCallBacks(drone):
    drone.addMessageListener(mavutil.mavlink.MAVLINK_MSG_ID_VFR_HUD, sendTelemetry, interval=0.25)
    drone.addMessageListener(mavutil.mavlink.MAVLINK_MSG_ID_SYS_STATUS, sendBattery)

def setupDroneTelemetry():
    time.sleep(2)
    port = getComPort()
    drone = Drone(port)
    setupCallBacks(drone)

if __name__ == "__main__":
    socketio.start_background_task(setupDroneTelemetry)
    socketio.run(app, allow_unsafe_werkzeug=True)
    