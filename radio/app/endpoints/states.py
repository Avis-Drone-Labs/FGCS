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


GLOBAL_MESSAGE_LISTENERS = ["HEARTBEAT", "STATUSTEXT", "GLOBAL_POSITION_INT"]

STATES_MESSAGE_LISTENERS = {
    "dashboard": [
        "VFR_HUD",
        "BATTERY_STATUS",
        "ATTITUDE",
        "ALTITUDE",
        "NAV_CONTROLLER_OUTPUT",
        "SYS_STATUS",
        "GPS_RAW_INT",
        "RC_CHANNELS",
        "ESC_TELEMETRY_5_TO_8",
        "MISSION_CURRENT",
        "EKF_STATUS_REPORT",
        "VIBRATION",
    ],
    "missions": [
        "NAV_CONTROLLER_OUTPUT",
    ],
    "graphs": ["VFR_HUD", "ATTITUDE", "SYS_STATUS"],
    "config.flight_modes": [
        "RC_CHANNELS",
    ],
    "config.rc": ["RC_CHANNELS"],
}


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

    droneStatus.drone.logger.info(f"Changing state to {droneStatus.state}")

    # Reset all data streams
    droneStatus.drone.stopAllDataStreams()

    # Always setup position stream to get GLOBAL_POSITION_INT messages
    droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_POSITION)

    for message in GLOBAL_MESSAGE_LISTENERS:
        droneStatus.drone.addMessageListener(message, sendMessage)

    if droneStatus.state == "dashboard":
        droneStatus.drone.setupDataStreams()
        for message in STATES_MESSAGE_LISTENERS["dashboard"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "missions":
        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
        )
        for message in STATES_MESSAGE_LISTENERS["missions"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "graphs":
        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
        )
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1)
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2)

        for message in STATES_MESSAGE_LISTENERS["graphs"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "config.flight_modes":
        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 2
        )

        for message in STATES_MESSAGE_LISTENERS["config.flight_modes"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
    elif droneStatus.state == "config.rc":
        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 4
        )

        for message in STATES_MESSAGE_LISTENERS["config.rc"]:
            droneStatus.drone.addMessageListener(message, sendMessage)
