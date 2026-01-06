import time
from app import socketio
import docker
from docker.errors import DockerException, NotFound

CONTAINER_NAME = "fgcs_ardupilot_sitl"
IMAGE_NAME = "kushmakkapati/ardupilot_sitl"
CONTAINER_START_TIMEOUT = 60


def get_docker_client():
    """
    Returns a Docker client if available, otherwise None.
    """
    try:
        return docker.from_env()
    except DockerException:
        return None


def pull_image_if_needed(client, image_name) -> bool:
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
    except docker.errors.ImageNotFound:
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
                },
                "simulation_result",
                {
                    "success": False,
                    "message": "Error downloading simulation image",
                },
            )
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

    if "vehicleType" in data:
        cmd.append(f"VEHICLE={data['vehicleType']}")
    if "lat" in data:
        cmd.append(f"LAT={data['lat']}")
    if "lon" in data:
        cmd.append(f"LON={data['lon']}")
    if "alt" in data:
        cmd.append(f"ALT={data['alt']}")
    if "dir" in data:
        cmd.append(f"DIR={data['dir']}")

    return cmd


def container_already_running(client, container_name) -> bool:
    """
    Checks if the client already has the given container running.
    If it exists but is not running it will be forcibly removed.
    """
    try:
        existing = client.containers.get(container_name)
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
            existing.remove(force=True)
            return False

    except docker.errors.NotFound:
        return False


def wait_for_container_running_result(
    container, connect, timeout=CONTAINER_START_TIMEOUT
):
    """
    Waits to determine whether the container starts successfully by monitoring its logs
    for the message "YOU CAN NOW CONNECT". During processing the log output is
    concatenated without spaces, so the function actually searches for the string
    "YOUCANNOWCONNECT" in the accumulated buffer.

    Args:
        container: The container to wait for.
        connect: If the drone should attempt to connect on successful container start.
        timeout: The amount of time to wait before timing out.
    """
    start_time = time.time()
    line_found = False
    buffer = ""

    try:
        for line in container.logs(stream=True):
            decoded = line.decode().strip()
            buffer += decoded

            if "YOUCANNOWCONNECT" in buffer:
                line_found = True
                break

            if time.time() - start_time > timeout:
                break

            if container.status == "exited":
                break

        socketio.emit(
            "simulation_result",
            {
                "success": line_found,
                "running": line_found,
                "connect": connect and line_found,
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
    if "port" in data:
        port = data["port"]
    else:
        emit_error_message("Port is required")
        return

    if not (1 <= port <= 65535):
        emit_error_message("Port must be between 1 and 65535")
        return

    if "connect" in data:
        connect = data["connect"]
    else:
        connect = False

    # Get rid of any other parameters that are none
    data = {k: str(v) for k, v in data.items() if v is not None}

    cmd = build_command(data)

    client = get_docker_client()
    if client is None:
        emit_error_message("Unable to connect to Docker")
        return

    image_result = pull_image_if_needed(client, IMAGE_NAME)
    if image_result is False:
        return  # Error already given in function

    if container_already_running(client, CONTAINER_NAME):
        return  # Error already given in function

    try:
        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            ports={port: port},
            stdin_open=True,
            tty=True,
            detach=True,
            remove=True,
            command=cmd,
        )

        socketio.start_background_task(
            wait_for_container_running_result,
            container,
            connect,
            CONTAINER_START_TIMEOUT,
        )

    except DockerException:
        emit_error_message("Simulation failed to start")


@socketio.on("stop_docker_simulation")
def stop_docker_simulation() -> None:
    """
    Stops the running Docker container identified by CONTAINER_NAME.
    """
    client = get_docker_client()
    if client is None:
        socketio.emit(
            "simulation_result",
            {"success": False, "message": "Unable to connect to Docker"},
        )
        return

    try:
        try:
            container = client.containers.get(CONTAINER_NAME)

        except NotFound:
            emit_error_message("Simulation could not be found")
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
        message: The message to be included in the emit
    """
    socketio.emit(
        "simulation_result",
        {
            "success": False,
            "running": False,
            "message": message,
        },
    )
