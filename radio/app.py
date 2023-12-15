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
    print(msg.current_battery)
    data = {
        "status": "ACTIVE",
        "battery_voltage": f"{(msg.voltages[0] / 1000):.2f}",
        "battery_current": f"{(msg.current_battery / 100):.2f}",
        "battery_remaining": msg.battery_remaining,
    }
    socketio.emit("set_battery", data)


def sendTelemetry(msg):
    data = {
        "status": "ACTIVE",
        "airspeed": f"{msg.airspeed:.2f}",
        "groundspeed": f"{msg.groundspeed:.2f}",
        "altitude": f"{msg.alt:.2f}",
        "throttle": str(msg.throttle).zfill(2),
        "heading": str(msg.heading).zfill(2),
    }
    socketio.emit("set_telemetry", data)


def sendPosition(msg):
    data = {"status": "ACTIVE", "lat": f"{msg.lat:.2f}", "lon": f"{msg.lon:.2f}"}
    socketio.emit("set_gps", data)


def setupCallBacks(drone):
    drone.addMessageListener("VFR_HUD", sendTelemetry)
    drone.addMessageListener("BATTERY_STATUS", sendBattery)
    drone.addMessageListener("GLOBAL_POSITION_INT", sendPosition)


def setupDroneTelemetry():
    time.sleep(2)
    port = getComPort()
    drone = Drone(port)
    setupCallBacks(drone)


if __name__ == "__main__":
    socketio.start_background_task(setupDroneTelemetry)
    socketio.run(app, allow_unsafe_werkzeug=True)
