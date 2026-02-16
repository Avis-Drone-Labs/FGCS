import os
import threading
from typing import Any, Tuple, Optional
from typing_extensions import TypedDict

from app import logger, socketio
import docker
from docker.errors import DockerException, NotFound, ImageNotFound, APIError

from docker import DockerClient
from docker.models.containers import Container


def get_int_env(name: str, default: int) -> int:
    """
    Safely convert an environment variable to an int and if this fails log the error.
    """
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        logger.exception(f"Invalid environment variable: {name} should be an int")
        return default


CONTAINER_NAME = "fgcs_ardupilot_sitl"
IMAGE_NAME = os.getenv("ARDUPILOT_SITL_IMAGE", "kushmakkapati/ardupilot_sitl:latest")
CONTAINER_START_TIMEOUT = get_int_env("CONTAINER_START_TIMEOUT", 60)
CONTAINER_STOP_TIMEOUT = get_int_env("CONTAINER_STOP_TIMEOUT", 10)
CONTAINER_READY_MESSAGE = "YOU CAN NOW CONNECT"
ALLOWED_VEHICLE_TYPES = {"ArduCopter", "ArduPlane"}


class SimulationError(Exception):
    """Custom exception for simulation-related failures."""

    def __init__(self, message: str, original_exception: Optional[Exception] = None):
        super().__init__(message)
        self.user_message = message
        self.original_exception = original_exception


class SimulationStartType(TypedDict, total=False):
    ports: list[dict[str, Any]]
    connect: bool
    vehicleType: str


def get_docker_client() -> DockerClient:
    """
    Returns a Docker client if available.
    """
    try:
        client = docker.from_env()
        client.ping()  # verify reachable
        return client
    except DockerException as e:
        raise SimulationError("Unable to connect to Docker", e) from e
    except Exception as e:
        raise SimulationError(
            "Unexpected error when creating and pinging Docker client", e
        ) from e


def ensure_image_exists(client: DockerClient, image_name: str) -> bool:
    """
    Checks if the client contains the given image.
    If not it attempts to download it.

    Args:
        client: The docker client.
        image_name: String for the name of the docker image.

    Returns:
        True if the image exists or is successfully downloaded.
    """
    # Operation id to correlate loading start/finish in the UI
    operation_id = f"docker-image:{image_name}"

    try:
        client.images.get(image_name)
        return True
    except ImageNotFound:
        socketio.emit(
            "simulation_loading",
            {
                "operationId": operation_id,
                "loading": True,
                "title": "Downloading Docker Image",
                "message": "Image not found. Attempting to download. This may take a while.",
            },
        )

        try:
            client.images.pull(image_name)

            socketio.emit(
                "simulation_loading",
                {
                    "operationId": operation_id,
                    "loading": False,
                    "success": True,
                    "title": "Downloaded Docker Image",
                    "message": "Simulation image successfully downloaded",
                },
            )
            return True
        except DockerException as e:
            socketio.emit(
                "simulation_loading",
                {
                    "operationId": operation_id,
                    "loading": False,
                    "success": False,
                    "title": "Docker Exception",
                    "message": "Error downloading simulation image",
                },
            )
            raise SimulationError("Error downloading simulation image", e) from e
    except DockerException as e:
        raise SimulationError("Unknown error getting simulation image", e) from e


def build_command(data: dict[str, Any]) -> Optional[list[str]]:
    """
    Parses the socketio data into the form required for the docker command.
    Because they are not treated as environment variables by the container.

    Args:
        data: The parameters that the simulator should start with.

    Returns:
        The command containing the parameters in the correct format.
    """
    cmd = []

    vehicle = data.get("vehicleType")
    if vehicle:
        if vehicle in ALLOWED_VEHICLE_TYPES:
            cmd.append(f"VEHICLE={vehicle}")
        else:
            logger.debug("Ignoring unsupported vehicleType: %s", vehicle)

    return cmd if cmd else None  # Docker start handles None better than empty lists


def container_already_running(client: DockerClient, container_name: str) -> bool:
    """
    Checks if the client already has the given container running.
    If it exists but is not running it will be forcibly removed.
    """
    try:
        existing = client.containers.get(container_name)
        existing.reload()
        if existing.status == "running":
            socketio.emit(
                "simulation_result",
                {
                    "success": False,
                    "running": True,
                    "message": "Simulation already running",
                },
            )
            return True
        else:
            try:
                existing.remove(force=True)
            except NotFound:
                # container already removed
                # (race condition with remove=True on container run)
                pass
            return False

    except NotFound:
        return False
    except DockerException as e:
        raise SimulationError(
            "Unexpected Docker exception while checking if container is running", e
        ) from e


def cleanup_container(container: Container) -> None:
    """
    Stop the container if it exists and is created, running, or restarting
    """
    try:
        container.reload()
        if container.status in ("running", "created", "restarting"):
            container.stop(timeout=CONTAINER_STOP_TIMEOUT)
    except NotFound:
        pass  # already gone (remove=True or race)
    except DockerException:
        logger.exception("Failed to cleanup container")


def wait_for_container_connection_msg(
    client: DockerClient,
    container: Container,
    connect: bool,
    port: int,
    timeout: int = CONTAINER_START_TIMEOUT,
) -> None:
    """
    Waits for the container to emit CONTAINER_READY_MESSAGE in its logs.
    Emits a simulation_result event on success or failure.

    Uses a background thread to stream logs, enforcing a strict timeout.

    Args:
        client: Docker client to close after done.
        container: The container to wait for.
        connect: If FGCS should attempt connection after ready.
        port: The host port to connect to.
        timeout: Maximum time to wait for readiness.
    """
    line_found = False
    failure_reason = f"Container did not become ready within {timeout}s"

    def log_worker(result: dict):
        try:
            for line in container.logs(stream=True, follow=True):
                log_line = line.decode("utf-8").strip()
                if CONTAINER_READY_MESSAGE in log_line:
                    result["found"] = True
                    break
        except DockerException:
            result["error"] = "Docker error while streaming logs"
        except Exception as e:
            result["error"] = "Unexpected error while streaming logs"
            logger.exception(e)

    result: dict[str, bool | str] = {"found": False}
    thread = threading.Thread(target=log_worker, args=(result,), daemon=True)
    thread.start()
    thread.join(timeout)  # Wait up to timeout seconds

    if result.get("error"):
        failure_reason = result["error"]  # type: ignore
        cleanup_container(container)
    elif result.get("found"):
        line_found = True
    else:
        # Thread timed out without finding the message
        cleanup_container(container)

    try:
        if hasattr(client, "close"):
            client.close()
    except Exception:
        logger.exception("Error closing Docker client after waiting for container")

    socketio.emit(
        "simulation_result",
        {
            "success": line_found,
            "running": line_found,
            "connect": bool(connect) and line_found,
            "port": port,
            "message": "Simulation started" if line_found else failure_reason,
        },
    )


def validate_ports(
    ports: Optional[list[dict[str, Any]]]
) -> Tuple[dict[str, str], Optional[int]]:
    """
    Construct the validated port mappings and primary host port
    """
    if not ports or not isinstance(ports, list):
        raise ValueError("At least one port mapping is required")

    validated_ports = {}
    seen_host_ports = set()
    seen_container_ports = set()
    primary_host_port = None

    for i, port in enumerate(ports):
        if not isinstance(port, dict):
            raise ValueError(f"Port entry {i + 1} is invalid")

        host_port = validate_port(i, port.get("hostPort"), 1025, 65535)

        if host_port in seen_host_ports:
            raise ValueError(f"Duplicate host port detected: {host_port}")
        seen_host_ports.add(host_port)

        container_port = validate_port(i, port.get("containerPort"), 1, 65535)

        if container_port in seen_container_ports:
            raise ValueError(f"Duplicate container port detected: {container_port}")
        seen_container_ports.add(container_port)

        if primary_host_port is None:
            primary_host_port = host_port

        # Convert back to string because that's what Docker expects
        validated_ports[str(container_port)] = str(host_port)

    return validated_ports, primary_host_port


def validate_port(i: int, port: Any, lower: int, upper: int) -> int:
    """
    Ensure that the given port is not none, an int and in the correct range.
    NOTE: does not check that the port is actually available.
    """
    if port is None:
        raise ValueError(f"Port entry {i + 1} is missing")

    try:
        port = int(port)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Port entry {i + 1} must be an integer") from e

    if not (lower <= port <= upper):
        raise ValueError(f"Port entry {i + 1} must be between {lower} and {upper}")

    return port


@socketio.on("start_docker_simulation")
def start_docker_simulation(data: SimulationStartType) -> None:
    """
    Starts the container identified by CONTAINER_NAME.

    Args:
        data: The parameters that the simulator should start with.
    """
    client = None

    try:
        validated_ports, primary_host_port = validate_ports(data.get("ports"))

        connect = data.get("connect", False)
        data_clean = {k: v for k, v in data.items() if v is not None}
        cmd = build_command(data_clean)

        client = get_docker_client()
        ensure_image_exists(client, IMAGE_NAME)

        if container_already_running(client, CONTAINER_NAME):
            return

        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            ports=validated_ports,
            detach=True,
            remove=True,
            command=cmd,
        )

        socketio.start_background_task(
            wait_for_container_connection_msg,
            client,
            container,
            connect,
            primary_host_port,
            CONTAINER_START_TIMEOUT,
        )

        client = None  # ownership transferred

    except ValueError as e:
        emit_error_message(str(e))
    except SimulationError as e:
        emit_error_message(e.user_message)
        if e.original_exception:
            logger.exception(e)
    except APIError as e:
        emit_error_message("Simulation failed to start: Docker API error")
        logger.exception(e)
    except DockerException as e:
        emit_error_message("Simulation failed to start: Docker exception")
        logger.exception(e)

    finally:
        if client is not None:
            client.close()


@socketio.on("stop_docker_simulation")
def stop_docker_simulation() -> None:
    """
    Stops the running Docker container identified by CONTAINER_NAME.
    """
    try:
        client = get_docker_client()
    except SimulationError as e:
        emit_error_message(e.user_message)
        if e.original_exception:
            logger.exception(e)
        return

    try:
        container = client.containers.get(CONTAINER_NAME)
        container.stop(timeout=CONTAINER_STOP_TIMEOUT)

        socketio.emit(
            "simulation_result",
            {"success": True, "running": False, "message": "Simulation stopped"},
        )

    except NotFound as e:
        emit_error_message("Simulation container could not be found")
        logger.exception(e)
    except DockerException as e:
        emit_error_message("Docker error while stopping simulation")
        logger.exception(e)

    finally:
        if client is not None:
            client.close()


def emit_error_message(message: str) -> None:
    """
    Emits the given message on "simulation_result" alongside false for success and running.

    Args:
        message: The message to be included in the emit.
    """
    socketio.emit(
        "simulation_result",
        {
            "success": False,
            "running": False,
            "message": message,
        },
    )
