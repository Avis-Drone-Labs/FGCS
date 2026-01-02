import time
from app import socketio
import docker
from docker.errors import DockerException

CONTAINER_NAME = "fgcs_ardupilot_sitl"
IMAGE_NAME = "kushmakkapati/ardupilot_sitl"


def get_docker_client():
    """
    Returns a Docker client if available, otherwise None.
    """
    try:
        return docker.from_env()
    except DockerException:
        return None


def ensure_image(client) -> bool:
    """
    Checks if the client contains the given image.
    If not it attempts to download it.

    Args:
        client: The docker client.

    Returns:
        True if the image exists or is successfully downloaded. Else False.
    """
    try:
        client.images.get(IMAGE_NAME)
        return True
    except docker.errors.ImageNotFound:
        socketio.emit(
            "simulation_result",
            {
                "message": "Image not found. Attempting to download.",
            },
        )

        try:
            client.images.pull(IMAGE_NAME)

            socketio.emit(
                "simulation_result",
                {
                    "success": True,
                    "message": "Simulation image downloaded",
                },
            )
            return True
        except DockerException:
            socketio.emit(
                "simulation_result",
                {
                    "success": False,
                    "message": "Error downloading simulation image",
                },
            )
            return False


def build_command(data):
    """
    Parses tbe socketio data into the form required for the docker command.

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
    If it exists but is not running it will be removed.
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


def wait_for_container_running_result(container, timeout=30):
    """
    Waits for if the container runs successfully and thus prints:
        "YOU CAN NOW CONNECT"

    Args:
        container: The container to wait for.
        timeout: The amount of time to wait before timing out.
    """
    start_time = time.time()
    line_found = False
    buffer = ""

    for line in container.logs(stream=True):
        decoded = line.decode().strip()
        buffer += decoded

        if "YOUCANNOWCONNECT" in buffer:
            line_found = True
            break

        if time.time() - start_time > timeout:
            break

    socketio.emit(
        "simulation_result",
        {
            "success": line_found,
            "running": line_found,
            "message": "Simulation started"
            if line_found
            else "Simulation failed to start in time",
        },
    )


@socketio.on("start_docker_simulation")
def start_docker_simulation(data) -> None:
    """
    Starts the container identified by CONTAINER_NAME.

    Args:
        data: The parameters that the simulator should start with.
    """
    # Get rid of any that are none
    data = {k: str(v) for k, v in data.items() if v is not None}

    cmd = build_command(data)

    client = get_docker_client()
    if client is None:
        socketio.emit(
            "simulation_result",
            {
                "success": False,
                "running": False,
                "message": "Unable to connect to Docker",
            },
        )
        return

    image_result = ensure_image(client)
    if image_result is False:
        return  # Error already given in function

    if container_already_running(client, CONTAINER_NAME):
        return  # Error already given in function

    try:
        port = data["port"]

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

        wait_for_container_running_result(container, timeout=30)

    except DockerException:
        socketio.emit(
            "simulation_result",
            {
                "success": False,
                "running": False,
                "message": "Simulation failed to start",
            },
        )


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
        container = client.containers.get(CONTAINER_NAME)
    except DockerException:
        socketio.emit(
            "simulation_result",
            {
                "success": False,
                "running": False,
                "message": "Simulation could not be found",
            },
        )
        return
    container.stop()
    socketio.emit(
        "simulation_result",
        {"success": True, "running": False, "message": "Simulation stopped"},
    )
