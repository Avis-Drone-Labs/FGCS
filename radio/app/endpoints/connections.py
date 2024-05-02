from .. import socketio
import app.droneStatus as droneStatus


@socketio.on("connect")
def connection():
    print("Client connected!")


@socketio.on("disconnect")
def disconnect():
    if droneStatus.drone:
        droneStatus.drone.close()
    droneStatus.drone = None
    droneStatus.state = None
    print("Client disconnected!")
