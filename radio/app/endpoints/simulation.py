from app import logger, socketio
import docker
from docker.errors import DockerException

CONTAINER_NAME = "drone_sitl"


def get_docker_client():
    try:
        return docker.from_env()
    except DockerException:
        return None


@socketio.on("start_docker_simulation")
def start_docker_simulation():
    client = get_docker_client()
    if client is None:
        socketio.emit(
            "simulation_result", {"success": False, "message": "Docker is not running"}
        )
        return

    try:
        client.containers.run(
            "kushmakkapati/ardupilot_sitl",
            name=CONTAINER_NAME,
            ports={"5760": 5760},
            detach=True,
            remove=True,
        )
        logger.debug("DOCKER STARTED SUCCESSFULLYB")

        socketio.emit(
            "simulation_result", {"success": True, "message": "Simulation started"}
        )
    except DockerException:
        socketio.emit(
            "simulation_result",
            {
                "success": False,
                "message": "Docker exception",
            },  # TODO: better error messages
        )


@socketio.on("stop_docker_simulation")
def stop_docker_simulation():
    client = get_docker_client()
    if client is None:
        socketio.emit(
            "simulation_result", {"success": False, "message": "Docker is not running"}
        )
        return

    container = client.containers.get(CONTAINER_NAME)
    container.stop()
