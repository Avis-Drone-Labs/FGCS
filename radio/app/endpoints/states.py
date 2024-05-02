import time
from .. import socketio
import app.droneStatus as droneStatus
from pymavlink import mavutil


@socketio.on("set_state")
def set_state(data):
    """
    Set the state of the drone based on the file current page we are on

    @param data: The form data passed in from the frontend, this contains the state we wish to change to
    """
    if not droneStatus.drone:
        return
    droneStatus.state = data.get("state")

    if droneStatus.state == "dashboard":
        droneStatus.drone.setupDataStreams()
        droneStatus.drone.addMessageListener("VFR_HUD", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("BATTERY_STATUS", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("ATTITUDE", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener(
            "GLOBAL_POSITION_INT", droneStatus.sendMessage
        )
        droneStatus.drone.addMessageListener("ALTITUDE", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener(
            "NAV_CONTROLLER_OUTPUT", droneStatus.sendMessage
        )
        droneStatus.drone.addMessageListener("HEARTBEAT", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener(
            "STATUSTEXT", droneStatus.sendMessage
        )  # TODO: Request message directly
        droneStatus.drone.addMessageListener("SYS_STATUS", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("GPS_RAW_INT", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("RC_CHANNELS", droneStatus.sendMessage)
    elif droneStatus.state == "graphs":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.setupSingleDataStream(
            mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS
        )
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA1)
        droneStatus.drone.setupSingleDataStream(mavutil.mavlink.MAV_DATA_STREAM_EXTRA2)

        droneStatus.drone.addMessageListener("VFR_HUD", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("ATTITUDE", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("SYS_STATUS", droneStatus.sendMessage)
    elif droneStatus.state == "params":
        droneStatus.drone.stopAllDataStreams()

        if len(droneStatus.drone.params):
            socketio.emit("params", droneStatus.drone.params)
            return

        droneStatus.drone.getAllParams()

        timeout = time.time() + 60 * 3  # 3 minutes from now
        last_index_sent = -1

        while droneStatus.drone and droneStatus.drone.is_requesting_params:
            if time.time() > timeout:
                socketio.emit(
                    "params_error",
                    {"message": "Parameter request timed out after 3 minutes."},
                )
                return

            if (
                last_index_sent != droneStatus.drone.current_param_index
                and droneStatus.drone.current_param_index > last_index_sent
            ):
                socketio.emit(
                    "param_request_update",
                    {
                        "current_param_index": droneStatus.drone.current_param_index,
                        "total_number_of_params": droneStatus.drone.total_number_of_params,
                    },
                )
                last_index_sent = droneStatus.drone.current_param_index

            time.sleep(0.2)

        if droneStatus.drone:
            socketio.emit("params", droneStatus.drone.params)
    elif droneStatus.state == "config":
        droneStatus.drone.stopAllDataStreams()
    elif droneStatus.state == "config.flight_modes":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 2
        )

        droneStatus.drone.addMessageListener("RC_CHANNELS", droneStatus.sendMessage)
        droneStatus.drone.addMessageListener("HEARTBEAT", droneStatus.sendMessage)
    elif droneStatus.state == "config.rc_calibration":
        droneStatus.drone.stopAllDataStreams()

        droneStatus.drone.sendDataStreamRequestMessage(
            mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, 4
        )
