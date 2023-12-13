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


@socketio.on("req_battery")
def reqBattery():
    battery_data = mockBatteryData()
    emit("ret_battery", battery_data)


@socketio.on("req_gps")
def reqGps():
    gps_data = mockGpsData()
    emit("ret_gps", gps_data)

def sendTelemetry(msg):
    print(f"Got telemetry data: {msg.id}, {msg.throttle}")
    data = {
        "status": "ACTIVE",
        "airspeed": f"{msg.airspeed:.2f}",
        "groundspeed": f"{msg.groundspeed:.2f}",
        "altitude": f"{msg.alt:.2f}",
        "throttle": str(msg.throttle).zfill(3),
        "heading": str(msg.heading).zfill(3)
    }
    socketio.emit("ret_telemetry", data)

def setupCallBacks(drone):
    drone.addMessageListener(
        mavutil.mavlink.MAVLINK_MSG_ID_VFR_HUD, sendTelemetry, interval=0.25
    )

def setupDroneTelemetry():
    time.sleep(3)
    port = getComPort()
    drone = Drone(port)
    setupCallBacks(drone)

if __name__ == "__main__":
    socketio.start_background_task(setupDroneTelemetry)
    socketio.run(app, allow_unsafe_werkzeug=True)
    