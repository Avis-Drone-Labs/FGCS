from flask_socketio.test_client import SocketIOTestClient
import time
import docker
from docker.errors import NotFound
from . import falcon_test

client = docker.from_env()
CONTAINER_NAME = "fgcs_ardupilot_sitl"
CLEANUP_CONTAINER_TRIES = 30


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
    for _ in range(CLEANUP_CONTAINER_TRIES):
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

    container = client.containers.get(CONTAINER_NAME)
    assert container.status in ("created", "running")

    cleanup_container()


@falcon_test()
def test_container_already_running_error_handling(socketio_client: SocketIOTestClient):
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


@falcon_test()
def test_pull_image_if_needed(socketio_client: SocketIOTestClient):
    """
    Test the pull_image_if_needed function directly.
    """
    from app.endpoints.simulation import pull_image_if_needed

    client = docker.from_env()

    # Remove the image if it exists
    try:
        client.images.remove("kushmakkapati/ardupilot_sitl", force=True)
    except docker.errors.ImageNotFound:
        pass

    # Call the function to ensure the image
    result = pull_image_if_needed(client, "kushmakkapati/ardupilot_sitl")

    # Verify the image is now present
    assert result is True
    try:
        client.images.get("kushmakkapati/ardupilot_sitl")
    except docker.errors.ImageNotFound:
        assert False, "Image was not pulled successfully"


@falcon_test()
def test_container_already_running(socketio_client: SocketIOTestClient):
    """
    Test the container_already_running function directly.
    """
    from app.endpoints.simulation import container_already_running

    client = docker.from_env()

    # Ensure no container is running
    cleanup_container()

    # Start a container manually
    client.containers.run(
        "kushmakkapati/ardupilot_sitl",
        name=CONTAINER_NAME,
        detach=True,
        tty=True,
    )

    # Verify the function detects the running container
    assert container_already_running(client, CONTAINER_NAME) is True

    # Stop and remove the container
    cleanup_container()


@falcon_test()
def test_emit_error_message(socketio_client: SocketIOTestClient):
    """
    Test the emit_error_message function directly.
    """
    from app.endpoints.simulation import emit_error_message

    # Emit an error message
    emit_error_message("Test error message")

    # Verify the emitted message
    result = socketio_client.get_received()[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is False
    assert result["args"][0]["running"] is False
    assert result["args"][0]["message"] == "Test error message"


@falcon_test()
def test_get_docker_client(socketio_client: SocketIOTestClient):
    """
    Test the get_docker_client function directly.
    """
    from app.endpoints.simulation import get_docker_client

    # Call the function
    client = get_docker_client()

    # Verify the client is valid or None
    if client is not None:
        assert hasattr(
            client, "containers"
        ), "Docker client does not have containers attribute"
    else:
        assert client is None, "Expected None when Docker is unavailable"


@falcon_test()
def test_wait_for_container_running_result(socketio_client: SocketIOTestClient):
    """
    Test the wait_for_container_running_result function directly.
    """
    from app.endpoints.simulation import wait_for_container_running_result

    # Start a container manually
    cleanup_container()
    container = client.containers.run(
        "kushmakkapati/ardupilot_sitl",
        name=CONTAINER_NAME,
        detach=True,
        tty=True,
    )

    # Call the function to wait for the container to start
    wait_for_container_running_result(container, connect=False, timeout=5)

    # Verify the container logs were processed
    result = client.containers.get(CONTAINER_NAME)
    assert result.status in (
        "running",
        "exited",
    ), "Container did not reach expected status"

    cleanup_container()
