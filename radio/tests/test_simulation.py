from flask_socketio.test_client import SocketIOTestClient
import docker
from . import falcon_test

client = docker.from_env()


def cleanup_container():
    """
    Helper function to remove the test container if it exists.
    """
    try:
        container = client.containers.get("fgcs_ardupilot_sitl")
        container.stop()
        container.remove()
    except docker.errors.NotFound:
        pass


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

    # Cleanup
    socketio_client.emit("stop_docker_simulation")
    stop_result = socketio_client.get_received()[-1]

    assert stop_result["args"][0]["success"] is True


@falcon_test()
def test_container_already_running(socketio_client: SocketIOTestClient):
    """
    Test behavior when the container is already running.
    """
    cleanup_container()

    # Start the container manually
    client.containers.run(
        "kushmakkapati/ardupilot_sitl",
        name="fgcs_ardupilot_sitl",
        ports={5764: 5764},
        detach=True,
        tty=True,
    )

    socketio_client.emit("start_docker_simulation", {"port": 5764})
    result = socketio_client.get_received()[-1]

    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is False
    assert "Simulation already running" in result["args"][0]["message"]

    cleanup_container()


@falcon_test()
def test_stop_docker_simulation(socketio_client: SocketIOTestClient):
    """
    Test stopping the Docker simulation.
    """
    cleanup_container()

    # Start the container manually
    client.containers.run(
        "kushmakkapati/ardupilot_sitl",
        name="fgcs_ardupilot_sitl",
        detach=True,
        tty=True,
    )

    socketio_client.emit("stop_docker_simulation")
    result = socketio_client.get_received()[-1]

    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is True
    assert "Simulation stopped" in result["args"][0]["message"]

    cleanup_container()


@falcon_test()
def test_build_command(socketio_client: SocketIOTestClient):
    """
    Test the build_command function directly.
    """
    from app.endpoints.simulation import build_command

    # Input data for the command
    data = {
        "vehicleType": "quad",
        "lat": 34.05,
        "lon": -118.25,
        "alt": 100,
        "dir": 90,
    }

    # Call the function
    cmd = build_command(data)

    # Verify the command output
    assert "VEHICLE=quad" in cmd
    assert "LAT=34.05" in cmd
    assert "LON=-118.25" in cmd
    assert "ALT=100" in cmd
    assert "DIR=90" in cmd
