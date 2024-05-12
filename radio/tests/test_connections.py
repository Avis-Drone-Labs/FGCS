from . import falcon_test
from flask_socketio.test_client import SocketIOTestClient


@falcon_test()
def test_connection(socketio_client: SocketIOTestClient):
    """Test connecting to socket"""
    socketio_client.emit("/connect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back

    
@falcon_test(pass_drone=True)
def test_disconnect(socketio_client: SocketIOTestClient, droneStatus):
    """Test disconnecting from socket"""
    socketio_client.emit("/disconnect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back
    
    assert droneStatus.drone is None  # Drone has been reset
    assert droneStatus.state is None  # State has been reset


@falcon_test(pass_drone=True)
def test_isConnectedToDrone(socketio_client: SocketIOTestClient, droneStatus):
    """Test to see if the drone is connected when we connect"""
    # Set drone to None and ask if we're connected
    droneStatus.drone = None
    socketio_client.emit("is_connected_to_drone")
    socketio_result = socketio_client.get_received()
    
    assert len(socketio_result) == 1  # Only 1 response got
    assert socketio_result[0]["args"] == [False]  # droneStatus.drone is None
    assert socketio_result[0]["name"] == "is_connected_to_drone"  # Correct name emitted back

    # Set drone and ask if we're connected


