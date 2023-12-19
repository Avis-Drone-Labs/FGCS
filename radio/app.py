import time

from flask import Flask
from flask_socketio import SocketIO

from drone import Drone
from utils import getComPort

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret-key"

socketio = SocketIO(app, cors_allowed_origins="*")

port = getComPort()
drone = Drone(port, wireless=True)

state = None

@app.route("/")
def index():
    return "Hello World!"


@socketio.on("connect")
def connection():
    print("Client connected!")


@socketio.on("disconnect")
def disconnect():
    print("Client disconnected!")

@socketio.on('set_state')
def set_state(data):
    global state
    state = data.get('state')

    if state == 'dashboard':
        drone.setupDataStreams()
        drone.addMessageListener("VFR_HUD", sendMessage)
        drone.addMessageListener("BATTERY_STATUS", sendMessage)
        drone.addMessageListener("ATTITUDE", sendMessage)
        drone.addMessageListener("GLOBAL_POSITION_INT", sendMessage)
    elif state == 'config':
        drone.stopAllDataStreams()

        if len(drone.params):
            socketio.emit('params', drone.params)
            return
        
        drone.getAllParams()

        timeout = time.time() + 60*3   # 3 minutes from now
        last_index_sent = -1

        while drone.is_requesting_params:
            if time.time() > timeout:
                socketio.emit('error', {'message': 'Parameter request timed out after 3 minutes.'})
                return
                
            if last_index_sent != drone.current_param_index and drone.current_param_index > last_index_sent:
                socketio.emit('param_request_update', {'current_param_index': drone.current_param_index, 'total_number_of_params': drone.total_number_of_params})
                last_index_sent = drone.current_param_index

            time.sleep(0.2)

        socketio.emit('params', drone.params)
        
@socketio.on('set_multiple_params')
def set_multiple_params(params_list):
    global state
    if state != 'config':
        socketio.emit('error', {'message': 'You must be on the config screen to save parameters.'})
        print(f'Current state: {state}')
        return
    
    success = drone.setMultipleParams(params_list)
    if success:
        socketio.emit('param_set_success', {'message': 'Parameters saved successfully.'})
    else:
        socketio.emit('error', {'message': 'Failed to save parameters.'})

@socketio.on('refresh_params')
def refresh_params():
    global state
    if state != 'config':
        socketio.emit('error', {'message': 'You must be on the config screen to refresh the parameters.'})
        print(f'Current state: {state}')
        return

    drone.getAllParams()

    timeout = time.time() + 60*3   # 3 minutes from now
    last_index_sent = -1

    while drone.is_requesting_params:
        if time.time() > timeout:
            socketio.emit('error', {'message': 'Parameter request timed out after 3 minutes.'})
            return
            
        if last_index_sent != drone.current_param_index and drone.current_param_index > last_index_sent:
            socketio.emit('param_request_update', {'current_param_index': drone.current_param_index, 'total_number_of_params': drone.total_number_of_params})
            last_index_sent = drone.current_param_index

        time.sleep(0.2)

    socketio.emit('params', drone.params)

def sendMessage(msg):
    data = msg.to_dict()
    data['timestamp'] = msg._timestamp
    socketio.emit("incoming_msg", data)

if __name__ == "__main__":
    socketio.run(app, allow_unsafe_werkzeug=True)
    drone.close()