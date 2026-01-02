from flask_socketio.test_client import SocketIOTestClient
from . import falcon_test


@falcon_test()
def test_start_docker_simulation_success(socketio_client: SocketIOTestClient):
    """
    Test successfully starting the simulation using Docker.
    """
    socketio_client.emit("start_docker_simulation", {"port": 5763})
    result = socketio_client.get_received()[-1]

    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is True
    assert "Simulation started" in result["args"][0]["message"]
