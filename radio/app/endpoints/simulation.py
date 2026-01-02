import time
from app import logger, socketio
import docker
from docker.errors import DockerException

CONTAINER_NAME = "ardupilot_sitl"
IMAGE_NAME = "kushmakkapati/ardupilot_sitl"


def get_docker_client():
    try:
        return docker.from_env()
    except DockerException:
        return None


def ensure_image(client):
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


@socketio.on("start_docker_simulation")
def start_docker_simulation(data):
    logger.debug(f"Current data: {data}")

    # Get rid of any that are none
    data = {k: str(v) for k, v in data.items() if v is not None}

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

    try:
        existing = client.containers.get(CONTAINER_NAME)
        if existing.status == "running":
            socketio.emit(
                "simulation_result",
                {
                    "success": False,
                    "running": True,
                    "message": "Simulation already running",
                },
            )
            return
        else:
            existing.remove(force=True)

    except docker.errors.NotFound:
        pass  # No container exists, so free to start one

    try:
        logger.debug(f"Current state: {data}")
        logger.debug(f"Command: {cmd}")

        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            ports={5760: 5760},
            stdin_open=True,
            tty=True,
            detach=True,
            remove=True,
            command=cmd,
        )

        timeout = 30
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

        if line_found:
            socketio.emit(
                "simulation_result",
                {"success": True, "running": True, "message": "Simulation started"},
            )
        else:
            socketio.emit(
                "simulation_result",
                {
                    "success": False,
                    "running": False,
                    "message": "Simulation failed to start in time",
                },
            )
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
def stop_docker_simulation():
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
