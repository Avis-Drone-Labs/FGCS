from flask_socketio.test_client import SocketIOTestClient
import time
import docker
from docker.errors import NotFound
from . import falcon_test

client = docker.from_env()
CONTAINER_NAME = "fgcs_ardupilot_sitl"


def cleanup_container():
    """
    Helper function to remove the test container if it exists.
    """
    try:
        container = client.containers.get(CONTAINER_NAME)
        container.remove(force=True)
    except NotFound:
        return

    # wait until Docker confirms it is gone
    for _ in range(20):
        try:
            client.containers.get(CONTAINER_NAME)
            time.sleep(0.1)
        except NotFound:
            return

    raise RuntimeError("Container did not clean up in time")


@falcon_test()
def test_start_docker_simulation_success(socketio_client: SocketIOTestClient):
    """
    Test successfully starting the simulation using Docker.
    """
    cleanup_container()

    socketio_client.emit("start_docker_simulation", {"port": 5763})

    client = docker.from_env()
    container = client.containers.get(CONTAINER_NAME)
    assert container.status in ("created", "running")

    cleanup_container()


@falcon_test()
def test_container_already_running(socketio_client: SocketIOTestClient):
    """
    Test behavior when the container is already running.
    """
    cleanup_container()

    # Start the container manually
    container = client.containers.run(
        "kushmakkapati/ardupilot_sitl",
        name=CONTAINER_NAME,
        ports={5763: 5763},
        detach=True,
        tty=True,
    )

    # Wait for it to be running
    container.reload()
    while container.status != "running":
        time.sleep(0.5)
        container.reload()

    socketio_client.emit("start_docker_simulation", {"port": 5763})
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
        name=CONTAINER_NAME,
        ports={5763: 5763},
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
