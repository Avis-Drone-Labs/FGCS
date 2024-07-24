export const mavlinkMsgParams = {
    // MAV_DATA_STREAM_EXTENDED_STATUS
   'FENCE_STATUS': {
        'breach_count': 'Breach count',
        'breach_status': 'Breach status',
        'breach_time': 'Breach time (ms)',
        'breach_type': 'Breach type'
    },
    'GPS_RAW_INT': {
        'alt': 'Altitude (mm)',
        'alt_ellipsoid': 'Altitude Ellipsoid (mm)',
        'cog': 'Course over ground (cdeg)',
        'eph': 'GPS HDOP',
        'epv': 'GPS VDOP',
        'h_acc': 'Position uncertainty (mm)',
        'hdg_acc': 'Heading/track uncertainty (°E5)',
        'lat': 'Latitude (°E7)',
        'lon': 'Longitude (°E7)',
        'satellites_visible': 'Total Satellites Visible',
        'time_usec': 'Timestamp (µs)',
        'v_acc': 'Altitude uncertainty (mm)',
        'vel': 'GPS ground speed (cm/s)',
        'vel_acc': 'Speed uncertainty (mm)',
        'yaw': 'Yaw (cdeg)'
    },
    'GPS_RTK': {
        'accuracy': 'Baseline accuracy',
        'baseline_a_mm': 'NED north (mm)',
        'baseline_b_mm': 'NED east (mm)',
        'baseline_c_mm': 'NED down (mm)',
        'baseline_coords_type': 'Baseline Coordinate System',
        'iar_num_hypotheses': 'Total integer ambiguity hypotheses',
        'nsats': 'Total sats used',
        'rtk_health': 'RTK Health',
        'rtk_rate': 'RTK Rate (Hz)',
        'rtk_receiver_id': 'RTK receiver ID',
        'time_last_baseline_ms': 'Time last baseline (ms)',
        'tow': 'TOW of last baseline (ms)',
        'wn': 'WN of last baseline'
    },
    'GPS2_RAW': {
        'alt': 'Altitude (mm)',
        'alt_ellipsoid': 'Altitude Ellipsoid (mm)',
        'cog': 'Course over ground (cdeg)',
        'dgps_age': 'DGPS age (ms)',
        'dgps_numch': 'Total DGPS satellites',
        'eph': 'GPS HDOP',
        'epv': 'GPS VDOP',
        'h_acc': 'Position uncertainty (mm)',
        'hdg_acc': 'Heading/track uncertainty (°E5)',
        'lat': 'Latitude (°E7)',
        'lon': 'Longitude (°E7)',
        'satellites_visible': 'Total Satellites Visible',
        'time_usec': 'Timestamp (µs)',
        'v_acc': 'Altitude uncertainty (mm)',
        'vel': 'GPS ground speed (cm/s)',
        'vel_acc': 'Speed uncertainty (mm)',
        'yaw': 'Yaw (cdeg)'
    },
    'GPS2_RTK': {
        'accuracy': 'Baseline accuracy',
        'baseline_a_mm': 'NED north (mm)',
        'baseline_b_mm': 'NED east (mm)',
        'baseline_c_mm': 'NED down (mm)',
        'baseline_coords_type': 'Baseline Coordinate System',
        'iar_num_hypotheses': 'Total integer ambiguity hypotheses',
        'nsats': 'Total sats used',
        'rtk_health': 'RTK Health',
        'rtk_rate': 'RTK Rate (Hz)',
        'rtk_receiver_id': 'RTK receiver ID',
        'time_last_baseline_ms': 'Time last baseline (ms)',
        'tow': 'TOW of last baseline (ms)',
        'wn': 'WN of last baseline'
    },
    'MEMINFO': {
        'brkval': 'Heap top',
        'freemem': 'Free memory (bytes)',
        'freemem32': 'Free memory 32-bit (bytes)'
    },
    'MISSION_CURRENT': {
        'fence_id': 'Fence ID',
        'mission_id': 'Mission ID',
        'rally_points_id': 'Rally Points ID',
        'seq': 'Sequence',
        'total': 'Total mission items'
    },
    'NAV_CONTROLLER_OUTPUT': {
        'alt_error': 'Current altitude error (m)',
        'aspd_error': 'Current airspeed error (m/s)',
        'nav_bearing': 'Des Heading (°)',
        'nav_pitch': 'Des Pitch (°)',
        'nav_roll': 'Des Roll (°)',
        'target_bearing': 'Bearing to Target (°)',
        'wp_dist': 'Distance to active waypoint (m)',
        'xtrack_error': 'Current crosstrack error (m)'
    },
    'POSITION_TARGET_GLOBAL_INT': {
        'afx': 'NED frame X acceleration (m/s/s)',
        'afy': 'NED frame Y acceleration (m/s/s)',
        'afz': 'NED frame Z acceleration (m/s/s)',
        'alt': 'Altitude (m)',
        'lat_int': 'Latitude (°E7)',
        'lon_int': 'Longitude (°E7)',
        'time_boot_ms': 'Timestamp (ms)',
        'vx': 'NED frame X Velocity (m/s)',
        'vy': 'NED frame Y Velocity (m/s)',
        'vz': 'NED frame Z Velocity (m/s)',
        'yaw': 'Yaw setpoint (rad)',
        'yaw_rate': 'Yaw rate setpoint (rad/s)'
    },
    'POWER_STATUS': {
        'Vcc': '5V Rail Voltage (mV)',
        'Vservo': 'Servo Rail Voltage (mV)'
    },
    'SYS_STATUS': {
        'current_battery': 'Battery Current (cA)',
        'drop_rate_comm': 'Comm Drop Rate (%)',
        'load': 'Load (%)',
        'voltage_battery': 'Battery Voltage (mV)'
    },

    // MAV_DATA_STREAM_POSITION
    'GLOBAL_POSITION_INT': {
        'alt': 'Altitude MSL (mm)',
        'hdg': 'Vehicle heading (cdeg)',
        'lat': 'Latitude, expressed (°E7)',
        'lon': 'Longitude, expressed (°E7)',
        'relative_alt': 'Altitude above home (mm)',
        'time_boot_ms': 'Timestamp (ms)',
        'vx': 'Ground X Speed (cm/s)',
        'vy': 'Ground Y Speed (cm/s)',
        'vz': 'Ground Z Speed (cm/s)'
    },
    'LOCAL_POSITION_NED': {
        'time_boot_ms': 'Timestamp (ms)',
        'vx': 'X Speed (m/s)',
        'vy': 'Y Speed (m/s)',
        'vz': 'Z Speed (m/s)',
        'x': 'X Position (m)',
        'y': 'Y Position (m)',
        'z': 'Z Position (m)'
    },

    // MAV_DATA_STREAM_EXTRA1
    'ATTITUDE': {
        'pitch': 'Pitch angle (rad)',
        'pitchspeed': 'Pitch angular speed (rad/s)',
        'roll': 'Roll angle (rad)',
        'rollspeed': 'Roll angular speed (rad/s)',
        'time_boot_ms': 'Timestamp (ms)',
        'yaw': 'Yaw angle (rad)',
        'yawspeed': 'Yaw angular speed (rad/s)'
    },
    'SIM_STATE': {
        'alt': 'Altitude (m)',
        'lat': 'Latitude (°)',
        'lat_int': 'Latitude (°E7)',
        'lon': 'Longitude (°)',
        'lon_int': 'Longitude (°E7)',
        'std_dev_horz': 'Horizontal Std dev',
        'std_dev_vert': 'Vertical Std dev',
        've': 'True velocity in east direction (m/s)',
        'vd': 'True velocity in down direction (m/s)',
        'vn': 'True velocity in north direction (m/s)',
        'q1': 'True attitude quaternion component 1, w',
        'q2': 'True attitude quaternion component 2, x',
        'q3': 'True attitude quaternion component 3, y',
        'q4': 'True attitude quaternion component 4, z',
        'xacc': 'X acceleration (m/s/s)',
        'xgyro': 'Angular speed X axis (rad/s)',
        'yacc': 'Y acceleration (m/s/s)',
        'ygyro': 'Angular speed Y axis (rad/s)',
        'zacc': 'Z acceleration (m/s/s)',
        'zgyro': 'Angular speed Z axis (rad/s)'
    },

    // MAV_DATA_STREAM_EXTRA2
    'VFR_HUD': {
        'airspeed': 'Vehicle Speed (m/s)',
        'alt': 'Altitude MSL (%)',
        'climb': 'Climb rate (m/s)',
        'groundspeed': 'Ground Speed (m/s)',
        'heading': 'Heading (°)',
        'throttle': 'Throttle (%)',
    },
    // MAV_DATA_STREAM_EXTRA3
    'BATTERY_STATUS': {
        'battery_remaining': 'Remaining battery (%)',
        'charge_state': 'Charge State',
        'current_battery': 'Battery current (cA)',
        'current_consumed': 'Consumed charge (mAh)',
        'energy_consumed': 'Consumed energy (hJ)',
        'id': 'Battery ID',
        'temperature': 'Temperature (°C)',
        'time_remaining': 'Remaining battery time (s)'
    },
    'DISTANCE_SENSOR': {
        'covariance': 'Measurement variance (cm^2)',
        'current_distance': 'Current distance (cm)',
        'id': 'Sensor ID',
        'horizontal_fov': 'Horizontal FOV (rad)',
        'max_distance': 'Max distance (cm)',
        'min_distance': 'Min distance (cm)',
        'signal_quality': 'Signal quality (%)',
        'time_boot_ms': 'Timestamp (ms)',
        'type': 'Sensor Type',
        'vertical_fov': 'Vertical FOV (rad)'
    },
    'GIMBAL_REPORT': {
        'delta_angle_x': 'Delta angle X (rad)',
        'delta_angle_y': 'Delta angle Y (rad)',
        'delta_angle_z': 'Delta angle Z (rad)',
        'delta_velocity_x': 'Delta velocity X (m/s)',
        'delta_velocity_y': 'Delta velocity Y (m/s)',
        'delta_velocity_z': 'Delta velocity Z (m/s)',
        'delta_time': 'Time since update (s)',
        'joint_az': 'Joint AZ (rad)',
        'joint_el': 'Joint EL (rad)',
        'joint_roll': 'Joint ROLL (rad)',
        'target_component': 'Component ID',
        'target_system': 'System ID'
    },
    'HWSTATUS': {
        'I2Cerr': 'I2C error count',
        'Vcc': 'Board voltage (mV)'
    },
    'MOUNT_STATUS': {
        'pointing_a': 'Pitch (cdeg)',
        'pointing_b': 'Roll (cdeg)',
        'pointing_c': 'Yaw (cdeg)',
        'target_component': 'Component ID',
        'target_system': 'System ID'
    },
    'OPTICAL_FLOW': {
        'flow_comp_m_x': 'Flow x angular-speed compensated (dpix)',
        'flow_comp_m_y': 'Flow y angular-speed compensated (dpix)',
        'flow_rate_x': 'Flow Rate X (rad/s)',
        'flow_rate_y': 'Flow Rate Y (rad/s)',
        'flow_x': 'Flow x (dpix)',
        'flow_y': 'Flow y (dpix)',
        'ground_distance': 'Ground distance (m)',
        'quality': 'Optical flow quality',
        'sensor_id': 'Sensor ID',
        'time_usec': 'Timestamp (µs)'
    },
    'RANGEFINDER': {
        'distance': 'Distance (m)',
        'voltage': 'Raw voltage (V)'
    },
    'SYSTEM_TIME': {
        'time_boot_ms': 'Timestamp system boot (ms)',
        'time_unix_usec': 'Timestamp UNIX epoch (µs)'
    }
}