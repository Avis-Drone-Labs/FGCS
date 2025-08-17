from pymavlink import mavutil, mavwp


def uploadMission(file_name, mission_type, master):
    with open(file_name, "r") as f:
        lines = f.readlines()

    if not lines[0].startswith("QGC WPL 110"):
        raise Exception("File is not supported WP version")

    if mission_type == "mission":
        loader = mavwp.MAVWPLoader()
        mission_type_int = 0
    elif mission_type == "fence":
        loader = mavwp.MissionItemProtocol_Fence()
        mission_type_int = 1
    elif mission_type == "rally":
        loader = mavwp.MissionItemProtocol_Rally()
        mission_type_int = 2
    else:
        raise ValueError(f"Invalid mission type: {mission_type}")

    for i, line in enumerate(lines[1:]):
        linearray = line.split("\t")
        if len(linearray) < 12 or line.startswith("#"):
            continue  # Skip lines that do not have enough data or are comments
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

        # For fence/rally, the first line is a home location so don't add it
        if mission_type != "mission" and i == 0:
            continue

        wp_item = mavutil.mavlink.MAVLink_mission_item_int_message(
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
            int(ln_x * 1e7),
            int(ln_y * 1e7),
            ln_z,
            mission_type_int,
        )
        loader.add(wp_item)

    master.mav.mission_count_send(
        master.target_system,
        master.target_component,
        loader.count(),
        mission_type=mission_type_int,
    )

    for i in range(loader.count()):
        msg = master.recv_match(type=["MISSION_REQUEST"], blocking=True, timeout=3)
        if msg is None:
            raise TimeoutError("Did not receive MISSION_REQUEST message within timeout")

        master.mav.send(loader.wp(msg.seq))

    print(f"Uploaded {mission_type} with {loader.count()} items")
