import os.path
import time

from pymavlink import mavutil, mavwp

master = mavutil.mavlink_connection("tcp:127.0.0.1:5760", retries=60)

master.wait_heartbeat()

wp = mavwp.MAVWPLoader()


def setHome(home_location, altitude):
    print("--- ", master.target_system, ",", master.target_component)
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_DO_SET_HOME,
        1,  # set position
        0,  # param1
        0,  # param2
        0,  # param3
        0,  # param4
        home_location[0],  # lat
        home_location[1],  # lon
        altitude,
    )


def uploadMission(aFileName):
    home_location = None
    home_altitude = None

    with open(aFileName) as f:
        for i, line in enumerate(f):
            if i == 0:
                if not line.startswith("QGC WPL 110"):
                    raise Exception("File is not supported WP version")
            else:
                linearray = line.split("\t")
                ln_seq = int(linearray[0])
                ln_current = int(linearray[1])
                ln_frame = int(linearray[2])
                ln_command = int(linearray[3])
                ln_param1 = float(linearray[4])
                ln_param2 = float(linearray[5])
                ln_param3 = float(linearray[6])
                ln_param4 = float(linearray[7])
                ln_x = float(linearray[8])
                ln_y = float(linearray[9])
                ln_z = float(linearray[10])
                ln_autocontinue = int(float(linearray[11].strip()))
                if i == 1:
                    home_location = (ln_x, ln_y)
                    home_altitude = ln_z
                p = mavutil.mavlink.MAVLink_mission_item_message(
                    master.target_system,
                    master.target_component,
                    ln_seq,
                    ln_frame,
                    ln_command,
                    ln_current,
                    ln_autocontinue,
                    ln_param1,
                    ln_param2,
                    ln_param3,
                    ln_param4,
                    ln_x,
                    ln_y,
                    ln_z,
                )
                wp.add(p)

    setHome(home_location, home_altitude)
    msg = master.recv_match(type=["COMMAND_ACK"], blocking=True)
    print(msg)
    print("Set home location: {0} {1}".format(home_location[0], home_location[1]))
    time.sleep(1)

    # send waypoint to airframe
    master.waypoint_clear_all_send()
    master.waypoint_count_send(wp.count())

    for i in range(wp.count()):
        msg = master.recv_match(type=["MISSION_REQUEST"], blocking=True)
        master.mav.send(wp.wp(msg.seq))
        print("Sending waypoint {0}".format(msg.seq))

    print("======")
    print("SENT ALL WAYPOINTS. YOU CAN NOW CONNECT")


if os.path.isfile("/sitl_setup/custom/mission.txt"):
    uploadMission("/sitl_setup/custom/mission.txt")
else:
    uploadMission("/sitl_setup/mission.txt")
