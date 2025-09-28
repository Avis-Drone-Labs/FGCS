from pymavlink import mavutil
from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import socketio
from app.utils import (
    missingParameterError,
    notConnectedError,
    sendMessage,
)


class SetStateType(TypedDict):
    state: str


@socketio.on("set_state")
def set_state(data: SetStateType) -> None:
    """
    Set the state of the drone based on the file current page we are on

    Args:
        data: The form data passed in from the frontend, this contains the state we wish to change to
    """
    if not droneStatus.drone:
        return notConnectedError(action="set the drone state")

    # Ensure that a state was actually sent
    if (newState := data.get("state", None)) is None:
        return missingParameterError("set_state", "state")

    droneStatus.state = newState

    message_listeners = {
        "dashboard": [
            "VFR_HUD",
            "BATTERY_STATUS",
            "GLOBAL_POSITION_INT",
            "ATTITUDE",
            "ALTITUDE",
            "NAV_CONTROLLER_OUTPUT",
            "HEARTBEAT",
            "STATUSTEXT",
            "SYS_STATUS",
            "GPS_RAW_INT",
            "RC_CHANNELS",
            "ESC_TELEMETRY_5_TO_8",
            "MISSION_CURRENT",
        ],
        "missions": ["GLOBAL_POSITION_INT", "NAV_CONTROLLER_OUTPUT", "HEARTBEAT"],
        "graphs": ["VFR_HUD", "ATTITUDE", "SYS_STATUS"],
        "config.flight_modes": ["RC_CHANNELS", "HEARTBEAT"],
    }

    droneStatus.drone.logger.info(f"Changing state to {droneStatus.state}")

    if droneStatus.state == "dashboard":
        droneStatus.drone.setupDataStreams()
        for message in message_listeners["dashboard"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    if droneStatus.state == "missions":
        droneStatus.drone.stopAllDataStreams()
        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
        )
        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_POSITION
        )
        for message in message_listeners["missions"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "graphs":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
        )
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1)
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2)

        for message in message_listeners["graphs"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "params":
        droneStatus.drone.stopAllDataStreams()
    elif droneStatus.state == "config":
        droneStatus.drone.stopAllDataStreams()
    elif droneStatus.state == "config.flight_modes":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 2
        )

        for message in message_listeners["config.flight_modes"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "config.rc":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 4
        )
