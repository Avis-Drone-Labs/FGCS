import app.droneStatus as droneStatus
from app import logger, socketio


@socketio.on("connect")
def connection() -> None:
    """
    Simply handle a client connections
    """
    logger.debug("Client connected!")


@socketio.on("disconnect")
def disconnect() -> None:
    """
    Handle client disconnection by reseting all global variables
    """
    if droneStatus.drone:
        droneStatus.drone.close()
    droneStatus.drone = None
    droneStatus.state = None
    logger.debug("Client disconnected!")


@socketio.on("is_connected_to_drone")
def isConnectedToDrone() -> None:
    """
    Handle client asking if we're connected to the drone or not
    """
    socketio.emit("is_connected_to_drone", bool(droneStatus.drone))


@socketio.on("get_target_info")
def getTargetInfo() -> None:
    """
    Return the target component and target system
    """
    if droneStatus.drone:
        socketio.emit(
            "target_info",
            {
                "target_component": droneStatus.drone.target_component,
                "target_system": droneStatus.drone.target_system,
            },
        )
    else:
        socketio.emit("target_info", None)


@socketio.on("start_forwarding")
def startForwarding(data: dict) -> None:
    """
    Start forwarding MAVLink messages to another address
    """
    if droneStatus.drone is None:
        socketio.emit(
            "forwarding_status", {"success": False, "message": "Not connected to drone"}
        )
        return

    address = data.get("address")
    if not address:
        socketio.emit(
            "forwarding_status", {"success": False, "message": "No address provided"}
        )
        return

    try:
        result = droneStatus.drone.startForwardingToAddress(address)
        socketio.emit(
            "forwarding_status",
            result,
        )
    except Exception as e:
        droneStatus.drone.logger.error(
            f"Failed to start forwarding: {e}", exc_info=True
        )
        socketio.emit("forwarding_status", {"success": False, "message": str(e)})


@socketio.on("stop_forwarding")
def stopForwarding() -> None:
    """
    Stop forwarding MAVLink messages
    """
    if droneStatus.drone is None:
        socketio.emit(
            "forwarding_status", {"success": False, "message": "Not connected to drone"}
        )
        return

    try:
        result = droneStatus.drone.stopForwarding()
        socketio.emit(
            "forwarding_status",
            result,
        )
    except Exception as e:
        droneStatus.drone.logger.error(f"Failed to stop forwarding: {e}", exc_info=True)
        socketio.emit("forwarding_status", {"success": False, "message": str(e)})
