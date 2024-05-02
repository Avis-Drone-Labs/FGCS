from .. import socketio
import app.droneStatus as droneStatus


@socketio.on("connect")
def connection() -> None:
    """
    Simply handle a client connections
    """
    print("Client connected!")


@socketio.on("disconnect")
def disconnect() -> None:
    """
    Handle client disconnection by reseting all global variables
    """
    if droneStatus.drone:
        droneStatus.drone.close()
    droneStatus.drone = None
    droneStatus.state = None
    print("Client disconnected!")


@socketio.on("is_connected_to_drone")
def isConnectedToDrone() -> None:
    """
    Handle client asking if we're connected to the drone or not
    """
    socketio.emit("is_connected_to_drone", bool(droneStatus.drone))
