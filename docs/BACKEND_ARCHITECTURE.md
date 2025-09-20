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
Manages drone parameter operations:

```python
class ParamsController:
    def getSingleParam(self, param_name: str) -> Response
    def getAllParams(self) -> None  
    def setParam(self, param_name: str, param_value: Number, param_type: int) -> bool
    def setMultipleParams(self, params_list: list[IncomingParam]) -> bool
```

**Key Features:**
- Thread-based parameter fetching to avoid blocking
- Parameter validation and type checking
- Batch parameter updates
- Parameter persistence and backup

### Arm Controller (`armController.py`)
Handles drone arming/disarming:

```python
class ArmController:
    def arm(self) -> bool
    def disarm(self) -> bool
    def checkArmingStatus(self) -> dict
```

**Safety Features:**
- Pre-arm safety checks
- Arming state validation
- Emergency disarm capabilities

### Flight Modes Controller (`flightModesController.py`)
Manages flight mode changes:

```python
class FlightModesController:
    def setFlightMode(self, mode: str) -> bool
    def getCurrentFlightMode(self) -> str
    def getAvailableFlightModes(self) -> list
```

**Supported Modes:**
- MANUAL, STABILIZE, ALTHOLD, LOITER
- AUTO, GUIDED, RTL, LAND
- Vehicle-specific modes (Copter/Plane/Rover)

### Mission Controller (`missionController.py`)
Handles mission planning and execution:

```python
class MissionController:
    def uploadMission(self, mission_items: list) -> bool
    def downloadMission(self) -> list
    def clearMission(self) -> bool
    def setCurrentMissionItem(self, seq: int) -> bool
```

**Mission Features:**
- Waypoint validation and optimization
- Mission upload/download with progress tracking
- Real-time mission execution monitoring
- Support for complex mission commands

### Motor Test Controller (`motorTestController.py`)
Provides motor testing capabilities:

```python
class MotorTestController:
    def testMotor(self, motor_id: int, throttle: int, duration: int) -> bool
    def testAllMotors(self, throttle: int, duration: int) -> bool
    def stopMotorTest(self) -> bool
```

**Safety Features:**
- Throttle limits and validation
- Duration limits
- Emergency stop functionality
- Pre-flight motor diagnostics

### Navigation Controller (`navController.py`)
Handles guided mode navigation:

```python
class NavController:
    def guidedMoveTo(self, lat: float, lon: float, alt: float) -> bool
    def guidedMoveBy(self, north: float, east: float, down: float) -> bool
    def setGuidedVelocity(self, vx: float, vy: float, vz: float) -> bool
```

### RC Controller (`rcController.py`)
Manages radio control inputs and channel mapping:

```python
class RcController:
    def getRcChannels(self) -> dict
    def overrideRcChannels(self, channels: dict) -> bool
    def clearRcOverride(self) -> bool
```

### Frame Controller (`frameController.py`)
Handles vehicle frame configuration:

```python
class FrameController:
    def getFrameType(self) -> str
    def setFrameType(self, frame_type: str) -> bool
    def getFrameConfig(self) -> dict
```

### Gripper Controller (`gripperController.py`)
Controls gripper/payload release mechanisms:

```python
class GripperController:
    def gripperGrab(self) -> bool
    def gripperRelease(self) -> bool
    def gripperStatus(self) -> dict
```

## API Endpoints

### HTTP Endpoints (`app/endpoints/`)

The backend exposes RESTful endpoints for various operations:

#### Connection Management (`endpoints/connections.py`)
- `GET /api/connections` - List available connection ports
- `POST /api/connections` - Establish drone connection
- `DELETE /api/connections` - Disconnect from drone

#### Parameters (`endpoints/params.py`)
- `GET /api/params` - Get all parameters
- `GET /api/params/<param_name>` - Get specific parameter
- `POST /api/params` - Set parameter values
- `POST /api/params/refresh` - Refresh parameter list

#### Mission Planning (`endpoints/mission.py`)
- `GET /api/mission` - Download current mission
- `POST /api/mission` - Upload new mission
- `DELETE /api/mission` - Clear mission
- `PUT /api/mission/current/<seq>` - Set current mission item

#### Flight Operations (`endpoints/flightMode.py`, `endpoints/arm.py`)
- `POST /api/arm` - Arm the drone
- `POST /api/disarm` - Disarm the drone
- `POST /api/flight-mode` - Change flight mode
- `GET /api/flight-modes` - Get available flight modes

#### Motor Testing (`endpoints/motors.py`)
- `POST /api/motors/test` - Test individual motor
- `POST /api/motors/test-all` - Test all motors
- `POST /api/motors/stop` - Stop motor tests

#### Navigation (`endpoints/nav.py`)
- `POST /api/nav/guided/moveto` - Move to coordinates
- `POST /api/nav/guided/moveby` - Move by offset
- `POST /api/nav/guided/velocity` - Set velocity

### Socket.IO Events

Real-time communication uses Socket.IO events:

#### Outgoing Events (Backend → Frontend)
- `drone_status` - Current drone state and telemetry
- `parameter_update` - Parameter value changes
- `mission_progress` - Mission execution updates
- `connection_status` - Connection state changes
- `error_message` - Error notifications

#### Incoming Events (Frontend → Backend)
- `connect_drone` - Request drone connection
- `disconnect_drone` - Request disconnection
- `arm_drone` - Arm request
- `set_flight_mode` - Flight mode change
- `upload_mission` - Mission upload
- `set_parameter` - Parameter change

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

## Performance Considerations

### Message Rate Limiting
- Data streams configured with appropriate rates
- Critical messages (attitude) at 10Hz
- Status messages at 2-3Hz
- Parameter operations are throttled

### Memory Management
- Parameter cache with size limits
- Message history with rotation
- Connection cleanup on disconnect
- Garbage collection for large operations

### Connection Optimization
- Heartbeat monitoring
- Automatic reconnection logic
- Connection health checks
- Bandwidth usage monitoring

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