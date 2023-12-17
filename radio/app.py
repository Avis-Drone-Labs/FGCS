import time

from utils import getComPort
from drone import Drone

from flask import Flask
from flask_socketio import SocketIO

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

def sendMessage(msg):
    socketio.emit("incoming_msg", msg.to_json())

def setupCallBacks(drone):
    drone.addMessageListener("VFR_HUD", sendMessage)
    drone.addMessageListener("BATTERY_STATUS", sendMessage)
    drone.addMessageListener("ATTITUDE", sendMessage)
    drone.addMessageListener("GLOBAL_POSITION_INT", sendMessage)


def setupDroneTelemetry():
    time.sleep(2)
    port = getComPort()
    drone = Drone(port)
    setupCallBacks(drone)


if __name__ == "__main__":
    socketio.start_background_task(setupDroneTelemetry)
    socketio.run(app, allow_unsafe_werkzeug=True)
