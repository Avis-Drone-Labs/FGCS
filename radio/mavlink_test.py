from pymavlink import mavutil
from utils import getComPort

# Start a connection listening on a UDP port
the_connection = mavutil.mavlink_connection(getComPort(), baud=57600)

# Wait for the first heartbeat
#   This sets the system and component ID of remote system for the link
the_connection.wait_heartbeat()
print(
    "Heartbeat from system (system %u component %u)"
    % (the_connection.target_system, the_connection.target_component)
)
