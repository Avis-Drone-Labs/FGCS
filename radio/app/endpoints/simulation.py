import os
import time
from app import logger, socketio
import docker
from docker.errors import DockerException, NotFound, ImageNotFound, APIError

CONTAINER_NAME = "fgcs_ardupilot_sitl"
IMAGE_NAME = "kushmakkapati/ardupilot_sitl"
CONTAINER_START_TIMEOUT = int(os.getenv("CONTAINER_START_TIMEOUT", 60))


def get_docker_client():
    """
    Returns a Docker client if available, otherwise None.
    """
    try:
        client = docker.from_env()
        client.ping()  # verify reachable
        return client
    except DockerException:
        return None


def ensure_image_exists(client, image_name) -> bool:
    """
    Checks if the client contains the given image.
    If not it attempts to download it.

    Args:
        client: The docker client.
        image_name: String for the name of the docker image.

    Returns:
        True if the image exists or is successfully downloaded. Else False.
    """
    try:
        client.images.get(image_name)
        return True
    except ImageNotFound:
        socketio.emit(
            "simulation_loading",
            {
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
                    "loading": False,
                    "success": True,
                    "title": "Downloaded Docker Image",
                    "message": "Simulation image successfully downloaded",
                },
            )
            return True
        except DockerException:
            socketio.emit(
                "simulation_loading",
                {
                    "loading": False,
                    "success": False,
                    "title": "Docker Exception",
                    "message": "Error downloading simulation image",
                },
            )
            emit_error_message("Error downloading simulation image")
            return False
    except DockerException:
        emit_error_message("Unknown error getting simulation image")
        return False


def build_command(data):
    """
    Parses the socketio data into the form required for the docker command.

    Args:
        data: The parameters that the simulator should start with.

    Returns:
        The command containing the parameters in the correct format.
    """
    cmd = []

    ALLOWED_VEHICLE_TYPES = {"ArduCopter", "ArduPlane"}

    vehicle = data.get("vehicleType")
    if vehicle:
        if vehicle in ALLOWED_VEHICLE_TYPES:
            cmd.append(f"VEHICLE={vehicle}")
        else:
            logger.debug("Ignoring unsupported vehicleType: %s", vehicle)

    return cmd if cmd else None  # Docker start handles None better than empty lists


def container_already_running(client, container_name) -> bool:
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


def wait_for_container_connection_msg(
    container, connect, port, timeout=CONTAINER_START_TIMEOUT
):
    """
    Waits to determine whether the container starts successfully by monitoring its logs
    for the message "YOU CAN NOW CONNECT". During streaming the logs spaces are stripped
    so actually searches for the string "YOUCANNOWCONNECT".

    Args:
        container: The container to wait for.
        connect: If the drone should attempt to connect on successful container start.
        port: The host port to connect to.
        timeout: The amount of time to wait before timing out.
    """
    start_time = time.time()
    line_found = False
    buffer = ""
    poll_interval_s = 0.5

    try:
        processed_len = 0

        while True:
            if time.time() - start_time > timeout:
                break

            try:
                container.reload()
            except DockerException:
                break

            try:
                logs_bytes = container.logs(stream=False)
            except DockerException:
                break

            # Process the container logs
            logs_text = logs_bytes.decode(errors="ignore")
            if processed_len < len(logs_text):
                new_text = logs_text[processed_len:]
                processed_len = len(logs_text)
                buffer += new_text.strip()

            if "YOUCANNOWCONNECT" in buffer.replace(" ", ""):
                line_found = True
                break

            if getattr(container, "status", None) == "exited":
                break

            time.sleep(poll_interval_s)

        socketio.emit(
            "simulation_result",
            {
                "success": line_found,
                "running": line_found,
                "connect": connect and line_found,
                "port": port,
                "message": "Simulation started"
                if line_found
                else "Simulation failed to start in time",
            },
        )

    except DockerException:
        emit_error_message("Docker error while awaiting connection message")


@socketio.on("start_docker_simulation")
def start_docker_simulation(data) -> None:
    """
    Starts the container identified by CONTAINER_NAME.

    Args:
        data: The parameters that the simulator should start with.
    """
    host_port = data.get("hostPort")
    if host_port is None:
        emit_error_message("Host port is required")
        return
    try:
        host_port = int(host_port)
    except (TypeError, ValueError):
        emit_error_message("Host port must be an integer")
        return
    if not (1025 <= host_port <= 65535):
        emit_error_message("Host port must be between 1025 and 65535")
        return

    container_port = data.get("containerPort", 5760)  # default internal port
    try:
        container_port = int(container_port)
    except (TypeError, ValueError):
        emit_error_message("Container port must be an integer")
        return
    if not (1 <= container_port <= 65535):
        emit_error_message("Container port must be between 1 and 65535")
        return

    connect = data["connect"] if "connect" in data else False

    # Get rid of any other parameters that are none
    data = {k: v for k, v in data.items() if v is not None}

    cmd = build_command(data)

    client = get_docker_client()
    if client is None:
        emit_error_message("Unable to connect to Docker")
        return

    if not ensure_image_exists(client, IMAGE_NAME):
        return  # Error message already given in the function

    if container_already_running(client, CONTAINER_NAME):
        return  # Error message already given in the function

    try:
        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            ports={container_port: host_port},
            detach=True,
            remove=True,
            command=cmd,
        )

        socketio.start_background_task(
            wait_for_container_connection_msg,
            container,
            connect,
            host_port,
            CONTAINER_START_TIMEOUT,
        )

    except APIError:
        emit_error_message("Simulation failed to start: Docker API error")
    except DockerException:
        emit_error_message("Simulation failed to start: Docker exception")


@socketio.on("stop_docker_simulation")
def stop_docker_simulation() -> None:
    """
    Stops the running Docker container identified by CONTAINER_NAME.
    """
    client = get_docker_client()
    if client is None:
        emit_error_message("Unable to connect to Docker")
        return

    try:
        try:
            container = client.containers.get(CONTAINER_NAME)

        except NotFound:
            emit_error_message("Simulation could not be found")
            return
        except DockerException:
            emit_error_message("Docker exception while getting container")
            return

        container.stop()
        socketio.emit(
            "simulation_result",
            {"success": True, "running": False, "message": "Simulation stopped"},
        )

    except DockerException:
        emit_error_message("Docker error while stopping simulation")


def emit_error_message(message):
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
