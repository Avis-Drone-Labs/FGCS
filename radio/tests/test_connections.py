from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test


@falcon_test()
def test_connection(socketio_client: SocketIOTestClient):
    """Test connecting to socket"""
    socketio_client.emit("connect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back


@falcon_test(pass_drone_status=True)
def test_isConnectedToDrone_with_drone(
    socketio_client: SocketIOTestClient, droneStatus
):
    """Test to see if the drone if we set it up"""
    socketio_client.emit("is_connected_to_drone")
    socketio_result = socketio_client.get_received()

    assert len(socketio_result) == 1  # Only 1 response
    assert socketio_result[0]["args"] == [True]  # droneStatus.drone is set
    assert socketio_result[0]["name"] == "is_connected_to_drone"  # Correct name emitted


@falcon_test(pass_drone_status=True)
def test_disconnect(socketio_client: SocketIOTestClient, droneStatus):
    """Test disconnecting from socket"""
    socketio_client.emit("disconnect")
    socketio_result = socketio_client.get_received()
    assert len(socketio_result) == 0  # No message sent back

    assert droneStatus.drone is None  # Drone has been reset
    assert droneStatus.state is None  # State has been reset
