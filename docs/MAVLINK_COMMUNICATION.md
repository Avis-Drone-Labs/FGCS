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

The drone connection process involves:
- Creating a MAVLink connection using PyMAVLink
- Configuring system and component IDs for ground control station
- Setting connection parameters (timeout, retries)
- Waiting for initial heartbeat from the drone
- Storing target system and component identifiers for communication

## Data Streams and Message Flow

### Incoming Data Processing

The drone continuously processes incoming MAVLink messages through a dedicated message listener that:
- Receives messages with appropriate timeouts
- Routes messages to specific handlers based on message type
- Handles communication errors and connection issues
- Maintains message processing statistics and logs

### Message Type Handling

Different message types are processed by routing them to appropriate handlers:
- HEARTBEAT messages for connection health and system status
- SYS_STATUS for system health and battery information
- ATTITUDE for roll, pitch, yaw data
- GPS_RAW_INT for position and navigation data
- PARAM_VALUE for parameter management
- COMMAND_ACK for command acknowledgments
- MISSION_ACK for mission operation responses

### Key Message Types

#### HEARTBEAT
- Sent every 1 second by drone
- Contains system status, flight mode, armed state
- Used for connection health monitoring
- Provides vehicle type and system capability information

#### ATTITUDE
- Roll, pitch, yaw angles and rates
- Updated at 10Hz for smooth display
- Critical for flight display instruments
- Provides angular velocities for advanced control

#### GPS_RAW_INT
- GPS position, altitude, satellite count
- GPS fix status and accuracy metrics
- Updated at 2-3Hz
- Includes precision indicators and fix quality

#### SYS_STATUS
- Battery voltage and current monitoring
- System health and error flags
- Sensor present/enabled/health status
- CPU load and system performance metrics

## Command Lock System

The command lock system prevents conflicting commands and ensures safe operation through:

### Lock Mechanism

The system uses threading locks and command sequencing to ensure:
- Only one command executes at a time
- Commands have unique identifiers and timeouts
- Pending commands are tracked and monitored
- Failed or timed-out commands are properly handled

### Command Processing Flow

Commands are processed with safety mechanisms including:
- Thread-safe command queuing
- Unique sequence number generation
- Command type validation and parameter checking
- Timeout monitoring and recovery
- Acknowledgment tracking and response handling

### Command Acknowledgment Handling

The system processes command acknowledgments to ensure reliable command execution:
- Matching acknowledgments with pending commands
- Processing command success/failure results
- Handling timeout scenarios and retries
- Executing completion callbacks
- Logging command execution results

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