import sys
import time

from drone import Drone
from flask import Flask
from flask_socketio import SocketIO
from serial.tools import list_ports

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret-key"

socketio = SocketIO(app, cors_allowed_origins="*")

correct_ports = []
drone = None
state = None


@app.route("/")
def index():
    return "Hello World!"


@socketio.on("connect")
def connection():
    print("Client connected!")


@socketio.on("disconnect")
def disconnect():
    global drone, state
    if drone:
        drone.close()
    drone = None
    state = None
    print("Client disconnected!")


@socketio.on("is_connected_to_drone")
def isConnectedToDrone():
    global drone
    socketio.emit("is_connected_to_drone", bool(drone))


@socketio.on("get_com_ports")
def getComPort():
    global drone, correct_ports
    ports = list(list_ports.comports())
    correct_ports = []
    for i in range(len(ports)):
        port = ports[i]
        if sys.platform == "darwin":
            port_name = port.name
            if port_name[:3] == "cu.":
                port_name = port_name[3:]

            port_name = f"/dev/tty.{port_name}"
        elif sys.platform in ["linux", "linux2"]:
            port_name = f"/dev/{port.name}"
        else:
            port_name = port.name

        port_name = f"{port_name}: {port.description}"
        correct_ports.append(port_name)
    socketio.emit("list_com_ports", correct_ports)


@socketio.on("set_com_port")
def setComPort(data):
    global drone
    if drone:
        drone.close()
        drone = None

    port = data.get("port").split(":")[0]
    baud = data.get("baud")
    drone = Drone(port, wireless=False, baud=baud)
    time.sleep(1)
    socketio.emit("connected_to_drone")


@socketio.on("disconnect_from_drone")
def disconnectFromDrone():
    global drone, state
    drone.close()
    drone = None
    state = None
    socketio.emit("disconnected_from_drone")


@socketio.on("set_state")
def set_state(data):
    global drone, state
    if not drone:
        return
    state = data.get("state")

    if state == "dashboard":
        drone.setupDataStreams()
        drone.addMessageListener("VFR_HUD", sendMessage)
        drone.addMessageListener("BATTERY_STATUS", sendMessage)
        drone.addMessageListener("ATTITUDE", sendMessage)
        drone.addMessageListener("GLOBAL_POSITION_INT", sendMessage)
        drone.addMessageListener("ALTITUDE", sendMessage)
        drone.addMessageListener("NAV_CONTROLLER_OUTPUT", sendMessage)
        drone.addMessageListener("HEARTBEAT", sendMessage)
        drone.addMessageListener(
            "STATUSTEXT", sendMessage
        )  # TODO: Request message directly
        drone.addMessageListener("SYS_STATUS", sendMessage)
        drone.addMessageListener("GPS_RAW_INT", sendMessage)
        drone.addMessageListener("RC_CHANNELS", sendMessage)
    elif state == "params":
        drone.stopAllDataStreams()

        if len(drone.params):
            socketio.emit("params", drone.params)
            return

        drone.getAllParams()

        timeout = time.time() + 60 * 3  # 3 minutes from now
        last_index_sent = -1

        while drone.is_requesting_params:
            if time.time() > timeout:
                socketio.emit(
                    "error", {"message": "Parameter request timed out after 3 minutes."}
                )
                return

            if (
                last_index_sent != drone.current_param_index
                and drone.current_param_index > last_index_sent
            ):
                socketio.emit(
                    "param_request_update",
                    {
                        "current_param_index": drone.current_param_index,
                        "total_number_of_params": drone.total_number_of_params,
                    },
                )
                last_index_sent = drone.current_param_index

            time.sleep(0.2)

        socketio.emit("params", drone.params)


@socketio.on("set_multiple_params")
def set_multiple_params(params_list):
    global state
    if state != "params":
        socketio.emit(
            "error", {"message": "You must be on the params screen to save parameters."}
        )
        print(f"Current state: {state}")
        return

    success = drone.setMultipleParams(params_list)
    if success:
        socketio.emit(
            "param_set_success", {"message": "Parameters saved successfully."}
        )
    else:
        socketio.emit("error", {"message": "Failed to save parameters."})


@socketio.on("refresh_params")
def refresh_params():
    global state
    if state != "params":
        socketio.emit(
            "error",
            {"message": "You must be on the params screen to refresh the parameters."},
        )
        print(f"Current state: {state}")
        return

    drone.getAllParams()

    timeout = time.time() + 60 * 3  # 3 minutes from now
    last_index_sent = -1

    while drone.is_requesting_params:
        if time.time() > timeout:
            socketio.emit(
                "error", {"message": "Parameter request timed out after 3 minutes."}
            )
            return

        if (
            last_index_sent != drone.current_param_index
            and drone.current_param_index > last_index_sent
        ):
            socketio.emit(
                "param_request_update",
                {
                    "current_param_index": drone.current_param_index,
                    "total_number_of_params": drone.total_number_of_params,
                },
            )
            last_index_sent = drone.current_param_index

        time.sleep(0.2)

    socketio.emit("params", drone.params)


def sendMessage(msg):
    data = msg.to_dict()
    data["timestamp"] = msg._timestamp
    socketio.emit("incoming_msg", data)


if __name__ == "__main__":
    socketio.run(app, allow_unsafe_werkzeug=True)
    if drone:
        drone.close()
