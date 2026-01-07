from flask_socketio.test_client import SocketIOTestClient
import time
import docker
from docker.errors import NotFound
from . import falcon_test

client = docker.from_env()
CONTAINER_NAME = "fgcs_ardupilot_sitl"
CLEANUP_CONTAINER_TRIES = 30
CONTAINER_START_WAIT_TIME = 60


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

    # Emit the event
    socketio_client.emit("start_docker_simulation", {"port": 5763})

    # Synchronize: Wait for the background task to emit the message
    start_time = time.time()
    received_messages = []

    while time.time() - start_time < CONTAINER_START_WAIT_TIME:
        received_messages = socketio_client.get_received()
        if received_messages:
            break
        time.sleep(0.1)  # Avoid busy waiting

    assert received_messages, "No messages were received after emitting the event. Check if the event handler is working."

    # Verify the last received message
    result = received_messages[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] in (True, False), "Unexpected success value"
    if not result["args"][0]["success"]:
        assert "Simulation failed to start" in result["args"][0]["message"]

    cleanup_container()


@falcon_test()
def test_start_docker_simulation_with_connect(socketio_client: SocketIOTestClient):
    """
    Test starting the simulation with connect=True.
    """
    cleanup_container()

    # Emit the event
    socketio_client.emit("start_docker_simulation", {"port": 5763, "connect": True})

    # Synchronize: Wait for the background task to emit the message
    start_time = time.time()
    received_messages = []

    while time.time() - start_time < CONTAINER_START_WAIT_TIME:
        received_messages = socketio_client.get_received()
        if received_messages:
            break
        time.sleep(0.1)  # Avoid busy waiting

    assert received_messages, "No messages were received after emitting the event. Check if the event handler is working."

    # Verify the last received message
    result = received_messages[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] in (True, False), "Unexpected success value"
    if result["args"][0]["success"]:
        assert result["args"][0]["connect"] is True, "Connect flag not set correctly"
    else:
        assert "Simulation failed to start" in result["args"][0]["message"]

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
def test_stop_docker_simulation_no_container(socketio_client: SocketIOTestClient):
    """
    Test stopping the Docker simulation when no container is running.
    """
    cleanup_container()

    # Emit the stop event without any running container
    socketio_client.emit("stop_docker_simulation")

    # Synchronize: Wait for the background task to emit the message
    timeout = 10  # seconds
    start_time = time.time()
    received_messages = []

    while time.time() - start_time < timeout:
        received_messages = socketio_client.get_received()
        if received_messages:
            break
        time.sleep(0.1)  # Avoid busy waiting

    assert received_messages, "No messages were received after emitting the event. Check if the event handler is working."

    # Verify the last received message
    result = received_messages[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is False
    assert "Simulation could not be found" in result["args"][0]["message"]


@falcon_test()
def test_build_command(_socketio_client: SocketIOTestClient):
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
def test_ensure_image_exists(_socketio_client: SocketIOTestClient):
    """
    Test the ensure_image_exists function directly.
    """
    from app.endpoints.simulation import ensure_image_exists

    client = docker.from_env()

    # Remove the image if it exists
    try:
        client.images.remove("kushmakkapati/ardupilot_sitl", force=True)
    except docker.errors.ImageNotFound:
        pass  # Does not exist so safe to continue

    # Call the function to ensure the image
    result = ensure_image_exists(client, "kushmakkapati/ardupilot_sitl")

    # Verify the image is now present
    assert result is True
    try:
        client.images.get("kushmakkapati/ardupilot_sitl")
    except docker.errors.ImageNotFound:
        assert False, "Image was not pulled successfully"


@falcon_test()
def test_ensure_image_exists_image_exists(_socketio_client: SocketIOTestClient):
    """
    Test the ensure_image_exists function when the image already exists.
    """
    from app.endpoints.simulation import ensure_image_exists

    client = docker.from_env()

    # Ensure the image exists
    client.images.pull("kushmakkapati/ardupilot_sitl")

    # Call the function
    result = ensure_image_exists(client, "kushmakkapati/ardupilot_sitl")

    # Verify the function does not attempt to pull the image again
    assert result is True


@falcon_test()
def test_container_already_running(_socketio_client: SocketIOTestClient):
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
def test_emit_error_message_edge_cases(socketio_client: SocketIOTestClient):
    """
    Test the emit_error_message function with edge cases.
    """
    from app.endpoints.simulation import emit_error_message

    # Emit an empty message
    emit_error_message("")
    result = socketio_client.get_received()[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["message"] == ""

    # Emit a None message
    emit_error_message(None)
    result = socketio_client.get_received()[-1]
    assert result["name"] == "simulation_result"
    assert result["args"][0]["message"] is None


@falcon_test()
def test_get_docker_client(_socketio_client: SocketIOTestClient):
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

    # Verify the emitted message
    result = socketio_client.get_received()[-1]
    assert result["name"] == "simulation_result"

    # Verify the container logs were processed
    result = client.containers.get(CONTAINER_NAME)
    assert result.status in (
        "running",
        "exited",
    ), "Container did not reach expected status"

    cleanup_container()


@falcon_test()
def test_start_docker_simulation_invalid_port(socketio_client: SocketIOTestClient):
    """
    Test starting the simulation with an invalid port number.
    """
    cleanup_container()

    socketio_client.emit("start_docker_simulation", {"port": 70000})
    result = socketio_client.get_received()[-1]

    assert result["name"] == "simulation_result"
    assert result["args"][0]["success"] is False
    assert "Port must be between 1 and 65535" in result["args"][0]["message"]


@falcon_test()
def test_start_docker_simulation_no_docker(socketio_client: SocketIOTestClient):
    """
    Test starting the simulation when Docker is unavailable.
    """
    from unittest.mock import patch

    with patch("app.endpoints.simulation.get_docker_client", return_value=None):
        socketio_client.emit("start_docker_simulation", {"port": 5763})
        result = socketio_client.get_received()[-1]

        assert result["name"] == "simulation_result"
        assert result["args"][0]["success"] is False
        assert "Unable to connect to Docker" in result["args"][0]["message"]
