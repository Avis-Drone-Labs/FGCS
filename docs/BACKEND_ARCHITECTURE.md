# Backend Architecture Guide

The FGCS backend is a Python Flask application that handles communication between the frontend and drones via MAVLink protocol. This document explains the architecture, controllers, endpoints, and data flow.

## Overview

```
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
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 10,  # ATTITUDE
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA2: 10,  # VFR_HUD  
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 2,   # BATTERY_STATUS
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

## Controllers Architecture

Controllers encapsulate specific drone functionality and handle related MAVLink commands:

### Parameters Controller (`paramsController.py`)
Manages drone parameter operations and provides methods for:
- Retrieving individual parameters
- Fetching all parameters from drone
- Setting single or multiple parameter values
- Parameter validation and type checking

**Key Features:**
- Thread-based parameter fetching to avoid blocking
- Parameter validation and type checking
- Batch parameter updates
- Parameter persistence and backup

### Arm Controller (`armController.py`)
Handles drone arming and disarming operations with safety features including:
- Pre-arm safety checks
- Arming state validation  
- Emergency disarm capabilities
- Arming status monitoring

### Flight Modes Controller (`flightModesController.py`)
Manages flight mode changes and supports various flight modes including:
- MANUAL, STABILIZE, ALTHOLD, LOITER
- AUTO, GUIDED, RTL, LAND  
- Vehicle-specific modes (Copter/Plane/Rover)

Provides functionality for setting flight modes, retrieving current mode, and listing available modes for the connected vehicle type.

### Mission Controller (`missionController.py`)
Handles mission planning and execution with features including:
- Waypoint validation and optimization
- Mission upload/download with progress tracking
- Real-time mission execution monitoring
- Support for complex mission commands

### Motor Test Controller (`motorTestController.py`)
Provides motor testing capabilities with safety features including:
- Throttle limits and validation
- Duration limits
- Emergency stop functionality
- Pre-flight motor diagnostics

### Navigation Controller (`navController.py`)
Handles guided mode navigation including:
- Waypoint navigation commands
- Relative movement operations
- Velocity control in guided mode
- Position and movement validation

### RC Controller (`rcController.py`)
Manages radio control inputs and channel mapping including:
- Channel value monitoring
- RC override capabilities
- Channel mapping configuration
- Input validation and safety limits

### Frame Controller (`frameController.py`)
Handles vehicle frame configuration including:
- Frame type detection and setting
- Frame-specific parameter management
- Configuration validation
- Vehicle-specific optimizations

### Gripper Controller (`gripperController.py`)
Controls gripper/payload release mechanisms including:
- Gripper actuation commands
- Status monitoring
- Safety interlocks
- Payload management operations

## Error Handling and Logging

### Logging System
```python
logger = getLogger("fgcs")
logger.setLevel(logging.INFO)
```

**Log Levels:**
- `ERROR`: Connection failures, command failures
- `WARNING`: Timeouts, parameter validation issues  
- `INFO`: Successful operations, state changes
- `DEBUG`: Detailed MAVLink message information

### Error Response Format
```python
{
    "success": False,
    "error": "Error description",
    "code": "ERROR_CODE",
    "details": {...}
}
```

### Common Error Scenarios
- **Connection Timeout**: Drone not responding
- **Parameter Validation**: Invalid parameter values
- **Command Rejected**: Drone safety systems prevent operation
- **Mission Upload Failed**: Invalid waypoints or sequence
- **Arming Failure**: Pre-arm checks failed

## State Management

### Drone Status Object
```python
class DroneStatus:
    def __init__(self):
        self.state = "disconnected"  # connected, params, ready
        self.armed = False
        self.flight_mode = "UNKNOWN"
        self.battery_voltage = 0.0
        self.gps_status = 0
        # ... additional status fields
```

### Connection States
1. **Disconnected**: No active connection
2. **Connecting**: Establishing MAVLink connection
3. **Connected**: MAVLink active, fetching parameters
4. **Params**: Loading parameter list
5. **Ready**: Fully operational

### Thread Safety
- Controller operations use thread-safe queues
- Parameter fetching runs in separate threads
- MAVLink message handling is thread-safe
- Socket.IO events are handled asynchronously

## Security Considerations

### Input Validation
- Parameter bounds checking
- Mission waypoint validation
- Command authorization
- Input sanitization

### Connection Security
- Port access validation
- Connection timeout limits
- Rate limiting for commands
- Error message sanitization

## Extending the Backend

### Adding New Controllers
1. Create controller class inheriting base patterns
2. Implement required methods with proper error handling
3. Add to drone initialization
4. Create corresponding endpoints
5. Add Socket.IO event handlers
6. Write unit tests

### Adding New Endpoints
1. Create endpoint module in `app/endpoints/`
2. Define route handlers with validation
3. Add to endpoint blueprint registration
4. Document API contract
5. Add integration tests

This architecture provides a robust, scalable foundation for drone ground control operations while maintaining clear separation of concerns and comprehensive error handling.