from app import socketio
import docker
from docker.errors import DockerException

CONTAINER_NAME = "drone_sitl"


@socketio.on("start_docker_simulation")
def start_docker_simulation() -> None:
    try:
        client = docker.from_env()

        client.containers.run(
            "kushmakkapati/ardupilot_sitl",
            name=CONTAINER_NAME,
            ports={"5760/udp": 5760},
            detach=True,
            remove=True,
        )
    except DockerException:
        socketio.emit(
            "simulation_error",
            {"message": "Docker exception"},  # TODO: better error messages
        )
