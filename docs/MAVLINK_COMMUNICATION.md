# MAVLink Communication Guide

This document explains how FGCS handles MAVLink communication, data flow, message processing, and the command lock system that ensures safe drone operations.

## MAVLink Overview

MAVLink (Micro Air Vehicle Link) is the protocol used for communication between ground control stations and drones. FGCS uses PyMAVLink to handle this communication.

## Connection Management

### Connection Types
FGCS supports multiple connection types:

```python
# Serial connection (USB/UART)
connection_string = "/dev/ttyUSB0"  # Linux
connection_string = "COM3"         # Windows

# TCP connection (SITL/Network)
connection_string = "tcp:127.0.0.1:5760"

# UDP connection
connection_string = "udp:127.0.0.1:14550"
```

### Connection Establishment
```python
class Drone:
    def __init__(self, port: str, baud: int = 57600, wireless: bool = False):
        # Create MAVLink connection
        self.master = mavutil.mavlink_connection(
            port, 
            baud=baud,
            source_system=255,      # GCS system ID
            source_component=0,     # GCS component ID
            retries=3,
            timeout=5
        )
        
        # Wait for initial heartbeat
        self.master.wait_heartbeat()
        
        # Store target system/component IDs
        self.target_system = self.master.target_system
        self.target_component = self.master.target_component
```

## Data Streams and Message Flow

### Incoming Data Processing

The drone continuously processes incoming MAVLink messages:

```python
def messageListener(self):
    """Main message processing loop"""
    while self.is_listening:
        try:
            # Receive message with timeout
            msg = self.master.recv_match(blocking=False, timeout=0.1)
            if msg is None:
                continue
                
            # Process message based on type
            self.processMessage(msg)
            
        except Exception as e:
            self.logger.error(f"Message processing error: {e}")
```

### Message Type Handling

Different message types are processed for various purposes:

```python
def processMessage(self, msg):
    """Process incoming MAVLink messages"""
    msg_type = msg.get_type()
    
    if msg_type == 'HEARTBEAT':
        self.handleHeartbeat(msg)
    elif msg_type == 'SYS_STATUS':
        self.handleSystemStatus(msg)
    elif msg_type == 'ATTITUDE':
        self.handleAttitude(msg)
    elif msg_type == 'GPS_RAW_INT':
        self.handleGPS(msg)
    elif msg_type == 'PARAM_VALUE':
        self.paramsController.handleParamValue(msg)
    elif msg_type == 'COMMAND_ACK':
        self.handleCommandAck(msg)
    elif msg_type == 'MISSION_ACK':
        self.missionController.handleMissionAck(msg)
    # ... additional message types
```

### Key Message Types

#### HEARTBEAT
- Sent every 1 second by drone
- Contains system status, flight mode, armed state
- Used for connection health monitoring

```python
def handleHeartbeat(self, msg):
    self.last_heartbeat = time.time()
    self.armed = (msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED) != 0
    self.flight_mode = self.getFlightMode(msg.custom_mode)
    self.vehicle_type = msg.type
```

#### ATTITUDE
- Roll, pitch, yaw angles and rates
- Updated at 10Hz for smooth display
- Critical for flight display instruments

```python
def handleAttitude(self, msg):
    attitude_data = {
        'roll': math.degrees(msg.roll),
        'pitch': math.degrees(msg.pitch), 
        'yaw': math.degrees(msg.yaw),
        'rollspeed': msg.rollspeed,
        'pitchspeed': msg.pitchspeed,
        'yawspeed': msg.yawspeed
    }
    self.emit('attitude_update', attitude_data)
```

#### GPS_RAW_INT
- GPS position, altitude, satellite count
- GPS fix status and accuracy metrics
- Updated at 2-3Hz

```python
def handleGPS(self, msg):
    gps_data = {
        'lat': msg.lat / 1e7,  # Convert to degrees
        'lon': msg.lon / 1e7,
        'alt': msg.alt / 1000,  # Convert to meters
        'satellites_visible': msg.satellites_visible,
        'fix_type': msg.fix_type,
        'hdop': msg.eph / 100.0  # Horizontal dilution of precision
    }
    self.emit('gps_update', gps_data)
```

#### SYS_STATUS
- Battery voltage and current
- System health and error flags
- Sensor present/enabled/health status

```python
def handleSystemStatus(self, msg):
    system_status = {
        'voltage_battery': msg.voltage_battery / 1000.0,  # mV to V
        'current_battery': msg.current_battery / 100.0,   # cA to A
        'battery_remaining': msg.battery_remaining,        # %
        'load': msg.load / 10.0,                          # %
        'errors_count': msg.errors_count1
    }
    self.emit('system_status_update', system_status)
```

## Command Lock System

The command lock system prevents conflicting commands and ensures safe operation:

### Lock Mechanism

```python
class Drone:
    def __init__(self):
        self.command_lock = threading.Lock()
        self.command_timeout = 5.0  # seconds
        self.pending_commands = {}
        self.command_sequence = 0
```

### Sending Commands with Lock

```python
def sendCommand(self, command_type, **kwargs):
    """Send MAVLink command with lock protection"""
    with self.command_lock:
        try:
            # Generate unique command sequence
            self.command_sequence += 1
            seq = self.command_sequence
            
            # Create command based on type
            if command_type == 'ARM':
                msg = self.master.mav.command_long_encode(
                    self.target_system,
                    self.target_component,
                    mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                    0,  # confirmation
                    1 if kwargs.get('arm', True) else 0,  # arm/disarm
                    0, 0, 0, 0, 0, 0  # unused parameters
                )
            elif command_type == 'SET_MODE':
                msg = self.master.mav.set_mode_encode(
                    self.target_system,
                    mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
                    kwargs['custom_mode']
                )
            # ... additional command types
            
            # Send command
            self.master.mav.send(msg)
            
            # Track pending command
            self.pending_commands[seq] = {
                'type': command_type,
                'timestamp': time.time(),
                'timeout': self.command_timeout,
                'callback': kwargs.get('callback')
            }
            
            return seq
            
        except Exception as e:
            self.logger.error(f"Command send failed: {e}")
            return None
```

### Command Acknowledgment Handling

```python
def handleCommandAck(self, msg):
    """Process command acknowledgments"""
    command = msg.command
    result = msg.result
    
    # Find pending command
    for seq, cmd_info in list(self.pending_commands.items()):
        if self.isMatchingCommand(cmd_info, command):
            # Remove from pending
            del self.pending_commands[seq]
            
            # Process result
            if result == mavutil.mavlink.MAV_RESULT_ACCEPTED:
                self.logger.info(f"Command {command} accepted")
                if cmd_info.get('callback'):
                    cmd_info['callback'](True, None)
            else:
                error_msg = self.getCommandErrorMessage(result)
                self.logger.error(f"Command {command} failed: {error_msg}")
                if cmd_info.get('callback'):
                    cmd_info['callback'](False, error_msg)
            break
```

### Command Timeout Handling

```python
def checkCommandTimeouts(self):
    """Check for timed out commands"""
    current_time = time.time()
    
    for seq, cmd_info in list(self.pending_commands.items()):
        if current_time - cmd_info['timestamp'] > cmd_info['timeout']:
            # Command timed out
            self.logger.warning(f"Command {cmd_info['type']} timed out")
            
            # Remove from pending
            del self.pending_commands[seq]
            
            # Call callback with timeout error
            if cmd_info.get('callback'):
                cmd_info['callback'](False, "Command timeout")
```

## Parameter Operations

Parameters require special handling due to their volume and complexity:

### Parameter Request Flow

```python
def getAllParams(self):
    """Request all parameters from drone"""
    # Stop data streams to prioritize parameter messages
    self.stopAllDataStreams()
    self.is_listening = False
    
    # Start parameter fetch thread
    self.getAllParamsThread = Thread(
        target=self.getAllParamsThreadFunc, 
        daemon=True
    )
    self.getAllParamsThread.start()
    
    # Send parameter request
    self.master.param_fetch_all()
    self.is_requesting_params = True
```

### Parameter Response Handling

```python
def getAllParamsThreadFunc(self):
    """Thread function to collect all parameters"""
    start_time = time.time()
    timeout = 30.0  # 30 second timeout
    
    while self.is_requesting_params:
        if time.time() - start_time > timeout:
            self.logger.error("Parameter fetch timeout")
            break
            
        try:
            # Wait for parameter message
            msg = self.master.recv_match(
                type='PARAM_VALUE', 
                blocking=True, 
                timeout=1.0
            )
            
            if msg:
                # Store parameter
                param_data = {
                    'param_id': msg.param_id,
                    'param_value': msg.param_value,
                    'param_type': msg.param_type,
                    'param_index': msg.param_index,
                    'param_count': msg.param_count
                }
                self.params.append(param_data)
                
                # Update progress
                self.current_param_index = msg.param_index
                self.total_number_of_params = msg.param_count
                
                # Check if complete
                if len(self.params) >= msg.param_count:
                    self.is_requesting_params = False
                    self.params = sorted(self.params, key=lambda k: k['param_id'])
                    self.logger.info("Got all params")
                    
                    # Resume data streams
                    self.is_listening = True
                    self.setupDataStreams()
                    break
                    
        except Exception as e:
            self.logger.error(f"Parameter fetch error: {e}")
            break
```

### Parameter Setting

```python
def setParam(self, param_name: str, param_value: Number, param_type: int, retries: int = 3) -> bool:
    """Set a parameter value with retries"""
    for attempt in range(retries):
        try:
            # Send parameter set command
            self.master.mav.param_set_encode(
                self.target_system,
                self.target_component,
                param_name.encode('utf-8'),
                param_value,
                param_type
            ).send()
            
            # Wait for confirmation
            start_time = time.time()
            while time.time() - start_time < 5.0:
                msg = self.master.recv_match(type='PARAM_VALUE', blocking=False)
                if msg and msg.param_id == param_name:
                    if abs(msg.param_value - param_value) < 0.0001:
                        return True
                    else:
                        self.logger.warning(f"Parameter {param_name} set to {msg.param_value}, expected {param_value}")
                        break
                time.sleep(0.1)
                
        except Exception as e:
            self.logger.error(f"Parameter set attempt {attempt + 1} failed: {e}")
            
    return False
```

## Mission Operations

Mission upload/download requires careful message sequencing:

### Mission Upload Flow

```python
def uploadMission(self, mission_items: list) -> bool:
    """Upload mission to drone"""
    try:
        # Clear existing mission
        self.master.mav.mission_clear_all_send(
            self.target_system,
            self.target_component
        )
        
        # Wait for clear acknowledgment
        ack = self.master.recv_match(type='MISSION_ACK', blocking=True, timeout=5.0)
        if not ack or ack.type != mavutil.mavlink.MAV_MISSION_ACCEPTED:
            return False
            
        # Send mission count
        self.master.mav.mission_count_send(
            self.target_system,
            self.target_component,
            len(mission_items)
        )
        
        # Upload mission items
        for i, item in enumerate(mission_items):
            # Wait for mission request
            req = self.master.recv_match(type='MISSION_REQUEST', blocking=True, timeout=5.0)
            if not req or req.seq != i:
                return False
                
            # Send mission item
            self.master.mav.mission_item_send(
                self.target_system,
                self.target_component,
                item['seq'],
                item['frame'],
                item['command'],
                item['current'],
                item['autocontinue'],
                item['param1'],
                item['param2'],
                item['param3'],
                item['param4'],
                item['x'],
                item['y'],
                item['z']
            )
        
        # Wait for final acknowledgment
        ack = self.master.recv_match(type='MISSION_ACK', blocking=True, timeout=5.0)
        return ack and ack.type == mavutil.mavlink.MAV_MISSION_ACCEPTED
        
    except Exception as e:
        self.logger.error(f"Mission upload failed: {e}")
        return False
```

## Error Handling and Recovery

### Connection Recovery

```python
def checkConnectionHealth(self):
    """Monitor connection health and attempt recovery"""
    current_time = time.time()
    
    # Check heartbeat timeout
    if current_time - self.last_heartbeat > 5.0:
        self.logger.warning("Heartbeat timeout detected")
        
        # Attempt reconnection
        try:
            self.master.close()
            self.master = mavutil.mavlink_connection(self.connection_string)
            self.master.wait_heartbeat(timeout=10)
            self.logger.info("Connection recovered")
            
        except Exception as e:
            self.logger.error(f"Reconnection failed: {e}")
            self.disconnect()
```

### Message Validation

```python
def validateMessage(self, msg):
    """Validate incoming message integrity"""
    # Check source system/component
    if hasattr(msg, 'get_srcSystem'):
        if msg.get_srcSystem() != self.target_system:
            return False
            
    # Check message completeness
    if not hasattr(msg, 'get_type'):
        return False
        
    # Validate critical fields based on message type
    msg_type = msg.get_type()
    if msg_type == 'ATTITUDE':
        return all(hasattr(msg, field) for field in ['roll', 'pitch', 'yaw'])
    elif msg_type == 'GPS_RAW_INT':
        return all(hasattr(msg, field) for field in ['lat', 'lon', 'alt'])
        
    return True
```

## Performance Optimization

### Message Rate Control

```python
# Configure appropriate data stream rates
DATASTREAM_RATES_WIRED = {
    mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS: 2,    # 2 Hz
    mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS: 2, # 2 Hz  
    mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS: 2,    # 2 Hz
    mavutil.mavlink.MAV_DATA_STREAM_POSITION: 3,       # 3 Hz
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 10,        # 10 Hz (Attitude)
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA2: 10,        # 10 Hz (VFR_HUD)
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 2,         # 2 Hz (Battery)
}

# Wireless rates (reduced for bandwidth)
DATASTREAM_RATES_WIRELESS = {
    stream: max(1, rate // 2) for stream, rate in DATASTREAM_RATES_WIRED.items()
}
```

### Buffer Management

```python
def manageMessageBuffer(self):
    """Prevent message buffer overflow"""
    # Clear old messages periodically
    if len(self.message_history) > 1000:
        self.message_history = self.message_history[-500:]
        
    # Prioritize critical messages
    critical_types = ['HEARTBEAT', 'ATTITUDE', 'GPS_RAW_INT']
    self.message_queue.sort(key=lambda msg: 0 if msg.get_type() in critical_types else 1)
```

This MAVLink communication system provides robust, efficient communication between FGCS and drones while maintaining safety through the command lock system and comprehensive error handling.