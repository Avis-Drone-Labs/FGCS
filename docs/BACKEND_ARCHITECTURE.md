# Backend Architecture Guide

The FGCS backend is a Python Flask application that handles communication between the frontend and the drone via the MAVLink protocol.

## Overview

```bash
Frontend (React/Electron)
    ↕ (Socket.IO/HTTP)
Backend (Flask/Socket.IO)
    ↕ (MAVLink/Serial/TCP)
Drone (ArduPilot/PX4)
```

## Core Components

### 1. Main Application (`app.py`)

- Flask application with Socket.IO integration
- Handles drone connection management
- Routes HTTP requests and Socket.IO events
- Manages application state and logging

### 2. Drone Class (`app/drone.py`)

The central class that manages drone communication and state:

```python
class Drone:
    def __init__(self, port, baud=57600, wireless=False, ...):
        # Core MAVLink connection
        self.master = mavutil.mavlink_connection(...)

        # Controller instances
        self.paramsController = ParamsController(self)
        self.armController = ArmController(self)
        self.flightModesController = FlightModesController(self)
        # ... other controllers
```

**Key Responsibilities:**

- Establish and maintain MAVLink connection
- Initialize all controller instances
- Handle data stream management
- Process incoming MAVLink messages
- Manage connection state and error handling

### 3. Data Streams

The drone class sets up various MAVLink data streams to receive telemetry:

```python
DATASTREAM_RATES_WIRED = {
    mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS: 2,
    mavutil.mavlink.MAV_DATA_STREAM_POSITION: 3,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 10,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA2: 10,
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 2,
}
```

**Stream Types and Messages:**

- **RAW_SENSORS**: IMU data, pressure sensors
- **EXTENDED_STATUS**: System status, GPS, mission info
- **RC_CHANNELS**: Radio control inputs and servo outputs
- **POSITION**: Local and global position data
- **EXTRA1**: Attitude data (roll, pitch, yaw)
- **EXTRA2**: VFR HUD data (airspeed, groundspeed, etc.)
- **EXTRA3**: Battery status, system time, vibration

### 4. The Command Lock

The command lock is a thread synchronization mechanism (typically implemented using Python’s `threading.Lock`) that ensures only one command is sent to the drone at a time. This is crucial because the MAVLink protocol and many autopilot firmwares expect commands to be sent and acknowledged sequentially. Sending multiple commands simultaneously can lead to race conditions, command collisions, or unexpected drone behavior.

**In practice:**
Whenever a controller needs to send a command to the drone (e.g., change mode, set a parameter, arm/disarm), it acquires the command lock, sends the command, waits for a response, and then releases the lock. This guarantees orderly and reliable communication with the drone. This can be achieved either manually by aquiring and releasing the lock, or by using the `sendingCommandLock` decorator.

**Note:**
If you aquire a lock inside a function which then uses another function which aquires the lock as well this will lead to the program halting. Ensure that the lock is released before any other function aquires it.

## Controllers Architecture

Controllers encapsulate specific drone functionality and handle related MAVLink commands:

### Parameters Controller (`paramsController.py`)

Manages drone parameter operations and provides methods for:

- Retrieving individual parameters
- Fetching all parameters from drone
- Setting single or multiple parameter values

### Arm Controller (`armController.py`)

Handles drone arming and disarming operations.

### Flight Modes Controller (`flightModesController.py`)

Provides functionality for setting flight modes, retrieving current mode, and listing available modes for the connected vehicle type.

### Mission Controller (`missionController.py`)

Handles mission planning and execution with features including:

- Mission upload/download with progress tracking
- Saving and importing missions to/from files
- Starting, stopping and restarting missions

### Motor Test Controller (`motorTestController.py`)

Provides motor testing capabilities.

### Navigation Controller (`navController.py`)

Handles guided mode navigation including:

- Waypoint navigation commands
- Takeoff and landing commands
- Home position related operations

### RC Controller (`rcController.py`)

Manages radio control inputs and channel mapping including.

### Frame Controller (`frameController.py`)

Handles vehicle frame type detection.

### Gripper Controller (`gripperController.py`)

Controls a gripper/payload release mechanism.
