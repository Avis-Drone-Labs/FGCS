# Frontend Architecture Guide

The FGCS frontend is an Electron application built with React, Vite, and Redux Toolkit. This document explains the architecture, component organization, Redux state management, and popout window system.

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI component library
- **Vite**: Build tool and development server
- **Redux Toolkit**: State management
- **Mantine**: Component library
- **Socket.IO Client**: Real-time communication with backend
- **React Router**: Navigation (if applicable)

## Project Structure

```
gcs/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   └── preload.js     # Preload scripts
├── src/               # React application source
│   ├── components/    # React components
│   ├── redux/         # Redux store and slices
│   ├── helpers/       # Utility functions
│   └── css/          # Stylesheets
├── public/            # Static assets
└── build/            # Built application
```

## Redux State Management

### Store Structure (`src/redux/store.js`)

```javascript
import { configureStore } from '@reduxjs/toolkit'
import droneConnectionSlice from './slices/droneConnectionSlice'
import droneInfoSlice from './slices/droneInfoSlice'
import missionSlice from './slices/missionSlice'
import paramsSlice from './slices/paramsSlice'
import socketSlice from './slices/socketSlice'
import statusTextSlice from './slices/statusTextSlice'
import notificationSlice from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    droneConnection: droneConnectionSlice.reducer,
    droneInfo: droneInfoSlice.reducer,
    mission: missionSlice.reducer,
    params: paramsSlice.reducer,
    socket: socketSlice.reducer,
    statusText: statusTextSlice.reducer,
    notifications: notificationSlice.reducer,
  },
})
```

### Key Redux Slices

#### 1. Drone Connection Slice (`droneConnectionSlice.js`)

Manages connection state and parameters:

```javascript
const initialState = {
  // Connection status
  connecting: false,
  connected: false,
  connection_modal: false,
  connection_status: null,

  // Connection parameters
  wireless: true,
  baudrate: "9600",
  connection_type: ConnectionType.Serial,
  
  // COM ports
  fetching_com_ports: false,
  com_ports: [],
  selected_com_ports: null,
  
  // Network parameters
  network_type: "tcp",
  ip: "127.0.0.1", 
  port: "5760",
  
  // Application state
  state: "dashboard",
}
```

**Key Actions:**
- `setConnecting()` / `setConnected()` - Connection state
- `setComPorts()` / `setSelectedComPorts()` - Serial port management
- `setIp()` / `setPort()` - Network connection settings
- `emitConnectToDrone()` / `emitDisconnectFromDrone()` - Socket.IO events

**Usage Pattern:**
Components connect to the Redux store using standard hooks and selectors to access connection state and trigger connection actions. The slice provides both state management and Socket.IO event emission capabilities.

#### 2. Drone Info Slice (`droneInfoSlice.js`)

Stores all drone telemetry and status data:

```javascript
const initialState = {
  attitudeData: { roll: 0.0, pitch: 0.0, yaw: 0.0 },
  telemetryData: { airspeed: 0.0, groundspeed: 0.0 },
  gpsData: { lat: 0.0, lon: 0.0, hdg: 0.0, alt: 0.0, relativeAlt: 0.0 },
  homePosition: { lat: 0, lon: 0, alt: 0 },
  heartbeatData: { baseMode: 0, customMode: 0, systemStatus: 0 },
  batteryData: [],
  guidedModePinData: { lat: 0, lon: 0, alt: 0 },
  // ... additional telemetry fields
}
```

**Key Actions:**
- `setAttitudeData()` - Roll, pitch, yaw updates
- `setGpsData()` - GPS position and status
- `setHeartbeatData()` - Flight mode and arming status
- `setBatteryData()` - Battery voltage and current
- `setGuidedModePinData()` - Guided mode target coordinates

**Memoized Selectors:**
```javascript
// Convert attitude from radians to degrees
export const selectAttitudeDeg = createSelector(
  [selectAttitude],
  ({ roll, pitch, yaw }) => ({
    roll: roll * (180 / Math.PI),
    pitch: pitch * (180 / Math.PI), 
    yaw: yaw * (180 / Math.PI),
  })
)

// Convert GPS coordinates from integers
export const selectDroneCoords = createSelector(
  [selectGPS],
  ({ lat, lon }) => ({ lat: lat * 1e-7, lon: lon * 1e-7 })
)

// Get flight mode string based on aircraft type
export const selectFlightModeString = createSelector(
  [selectFlightMode, selectAircraftType],
  (flightMode, aircraftType) => {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[flightMode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[flightMode]
    }
    return "UNKNOWN"
  }
)
```

#### 3. Mission Slice (`missionSlice.js`)

Handles mission planning data:

```javascript
const initialState = {
  mission: [],              // Mission waypoints
  currentMissionItem: 0,    // Active waypoint
  uploadProgress: 0,        // Upload progress percentage
  downloading: false,       // Download state
  uploading: false,         // Upload state
}
```

**Key Actions:**
- `setMission()` - Complete mission data
- `addMissionItem()` / `removeMissionItem()` - Individual waypoints
- `setCurrentMissionItem()` - Active waypoint tracking
- `setUploadProgress()` - Mission upload progress

#### 4. Parameters Slice (`paramsSlice.js`)

Manages drone parameter data:

```javascript
const initialState = {
  params: [],               // All parameters
  modifiedParams: [],       // Changed parameters
  fetchingParams: false,    // Loading state
  uploadingParams: false,   // Upload state
  searchFilter: "",         // Parameter search
}
```

**Key Actions:**
- `setParams()` - All parameter data
- `updateParam()` - Single parameter change
- `setModifiedParams()` - Track changes
- `setFetchingParams()` - Loading state management

#### 5. Socket Slice (`socketSlice.js`)

Manages Socket.IO connection state:

```javascript
const initialState = {
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
}
```

### Data Flow Patterns

#### 1. Real-time Data Updates

```javascript
// Socket.IO middleware handles incoming data
import { createListenerMiddleware } from '@reduxjs/toolkit'
import { socket } from '../helpers/socket'

const listenerMiddleware = createListenerMiddleware()

// Listen for socket events and dispatch Redux actions
socket.on('drone_status', (data) => {
  store.dispatch(setHeartbeatData(data.heartbeat))
  store.dispatch(setAttitudeData(data.attitude))
  store.dispatch(setGpsData(data.gps))
  store.dispatch(setBatteryData(data.battery))
})

socket.on('parameter_update', (data) => {
  store.dispatch(updateParam(data))
})
```

#### 2. Component Data Fetching

```javascript
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

function TelemetryDisplay() {
  const dispatch = useDispatch()
  const telemetry = useSelector(selectTelemetry)
  const attitude = useSelector(selectAttitudeDeg)
  const gps = useSelector(selectDroneCoords)
  
  useEffect(() => {
    // Request initial data on component mount
    dispatch(emitGetTelemetryData())
  }, [dispatch])
  
  return (
    <div>
      <div>Airspeed: {telemetry.airspeed} m/s</div>
      <div>Roll: {attitude.roll.toFixed(1)}°</div>
      <div>Position: {gps.lat.toFixed(6)}, {gps.lon.toFixed(6)}</div>
    </div>
  )
}
```

## Component Architecture

### Component Organization

Components are organized by feature and complexity level:

```
components/
├── layout.jsx              # App layout wrapper
├── navbar.jsx              # Main navigation
├── mainContent.jsx         # Content area router
├── dashboard/              # Dashboard components
│   ├── attitudeIndicator.jsx
│   ├── flightModePanel.jsx
│   ├── batteryStatus.jsx
│   └── gpsStatus.jsx
├── missions/               # Mission planning
│   ├── missionEditor.jsx
│   ├── waypointList.jsx
│   └── missionMap.jsx
├── params/                 # Parameter management
│   ├── paramsList.jsx
│   ├── paramsToolbar.jsx
│   └── paramRow.jsx
├── mapComponents/          # Map-related components
├── graphs/                 # Telemetry graphs
└── error/                  # Error handling
```

### Component Patterns

#### 1. Container Components

Handle data fetching and state management:

```javascript
function DashboardContainer() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  
  useEffect(() => {
    if (connected) {
      // Start telemetry data stream
      dispatch(emitStartTelemetryStream())
    }
  }, [connected, dispatch])
  
  if (!connected) {
    return <NoDroneConnected />
  }
  
  return (
    <div className="dashboard-grid">
      <AttitudeIndicator />
      <FlightModePanel />
      <BatteryStatus />
      <GPSStatus />
    </div>
  )
}
```

#### 2. Presentation Components

Focus on UI rendering:

```javascript
function AttitudeIndicator({ roll, pitch, yaw }) {
  return (
    <div className="attitude-indicator">
      <div 
        className="horizon" 
        style={{
          transform: `rotate(${roll}deg) translateY(${pitch * 2}px)`
        }}
      />
      <div className="heading-indicator">
        <div className="heading-value">{yaw.toFixed(0)}°</div>
      </div>
    </div>
  )
}

// Connected version
function ConnectedAttitudeIndicator() {
  const attitude = useSelector(selectAttitudeDeg)
  return <AttitudeIndicator {...attitude} />
}
```

#### 3. Custom Hooks

Encapsulate common logic:

```javascript
// Custom hook for socket communication
function useSocketEmit() {
  const dispatch = useDispatch()
  
  return useCallback((event, data) => {
    dispatch({ type: `socket/emit`, payload: { event, data } })
  }, [dispatch])
}

// Custom hook for parameter operations
function useParameters() {
  const dispatch = useDispatch()
  const params = useSelector(selectParams)
  
  const setParameter = useCallback((name, value, type) => {
    dispatch(emitSetParameter({ name, value, type }))
  }, [dispatch])
  
  const refreshParameters = useCallback(() => {
    dispatch(emitRefreshParameters())
  }, [dispatch])
  
  return { params, setParameter, refreshParameters }
}
```

## Popout Window System

FGCS supports popout windows for enhanced multi-monitor workflows.

### Popout Architecture

#### Main Process Management (`electron/main.ts`)

```typescript
// Main window reference
let win: BrowserWindow | null = null

// Popout window references
let webcamPopoutWin: BrowserWindow | null = null
let aboutPopoutWin: BrowserWindow | null = null
let linkStatsPopoutWin: BrowserWindow | null = null

function createWindow() {
  // Main window creation
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'app_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    show: false,
    alwaysOnTop: true,
    titleBarStyle: 'hidden',
    frame: false,
  })
  
  // Pre-create webcam window (hidden) to avoid delay
  webcamPopoutWin = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    show: false,
    title: "Webcam",
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
  })
}
```

#### Webcam Popout System

```typescript
function openWebcamPopout(videoStreamId: string, name: string, aspect: number) {
  if (!webcamPopoutWin) return
  
  // Calculate window size based on aspect ratio
  const height = 300
  const width = Math.round(height * aspect)
  const minHeight = MIN_WEBCAM_HEIGHT + WEBCAM_TITLEBAR_HEIGHT
  
  webcamPopoutWin.setSize(width, Math.max(height, minHeight))
  webcamPopoutWin.setMinimumSize(width, minHeight)
  
  // Load webcam content with video stream
  loadWebcam(videoStreamId, name)
  
  // Set up resize handler
  if (currentResizeHandler) {
    webcamPopoutWin.off('resize', currentResizeHandler)
  }
  
  currentResizeHandler = (event: Event, bounds: Rectangle) => {
    const newHeight = Math.max(bounds.height - WEBCAM_TITLEBAR_HEIGHT, MIN_WEBCAM_HEIGHT)
    const newWidth = Math.round(newHeight * aspect)
    
    if (Math.abs(bounds.width - newWidth) > 5) {
      webcamPopoutWin?.setSize(newWidth, bounds.height)
    }
  }
  
  webcamPopoutWin.on('resize', currentResizeHandler)
  webcamPopoutWin.show()
}

function loadWebcam(id: string = "", name: string = "") {
  if (!webcamPopoutWin) return
  
  const webcamUrl = `file://${path.join(__dirname, '../webcam.html')}`
  const urlWithParams = `${webcamUrl}?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
  
  webcamPopoutWin.loadURL(urlWithParams)
}
```

### Popout vs Main Window Differences

#### 1. Window Configuration

**Main Window:**
- Full application functionality
- Menu bar and navigation
- Multiple views and tabs
- Complex layout with sidebars
- Always-on-top optional

**Popout Windows:**
- Single-purpose functionality
- Minimal chrome (no menu bar)
- Always-on-top by default
- Smaller, focused content area
- Independent of main window state

#### 2. Content Loading

**Main Window:**
```typescript
// Loads full React application
win.loadURL(
  app.isPackaged
    ? `file://${path.join(__dirname, '../build/index.html')}`
    : 'http://localhost:5173'
)
```

**Popout Windows:**
```typescript
// Loads specific HTML file with parameters
const webcamUrl = `file://${path.join(__dirname, '../webcam.html')}`
const urlWithParams = `${webcamUrl}?id=${id}&name=${name}`
webcamPopoutWin.loadURL(urlWithParams)
```

#### 3. State Management

**Main Window:**
- Full Redux store access
- All application state
- Socket.IO connection manager
- Persistent settings

**Popout Windows:**
- Limited state scope
- Specific data passing via URL parameters
- Independent rendering context
- Minimal state requirements

#### 4. Communication Patterns

**Inter-Window Communication:**
```typescript
// IPC events for popout control
ipcMain.handle('webcam:open-popout', (event, videoStreamId, name, aspect) => {
  openWebcamPopout(videoStreamId, name, aspect)
})

ipcMain.handle('webcam:close-popout', () => {
  closeWebcamPopout()
})

// Main window to popout data passing
ipcMain.handle('webcam:update-stream', (event, streamData) => {
  if (webcamPopoutWin) {
    webcamPopoutWin.webContents.send('webcam:stream-update', streamData)
  }
})
```

**Renderer Process Usage:**
```javascript
// Main window requests popout
const openWebcamPopout = (streamId, name, aspectRatio) => {
  window.electronAPI.webcam.openPopout(streamId, name, aspectRatio)
}

// Popout window receives data
window.electronAPI.webcam.onStreamUpdate((data) => {
  updateVideoStream(data)
})
```

#### 5. Lifecycle Management

**Main Window:**
- Controls application lifecycle
- Manages backend process
- Handles app quit events
- Persists user settings

**Popout Windows:**
- Independent show/hide state
- Automatically destroyed on main window close
- No persistence requirements
- Event cleanup on destroy

```typescript
app.on('before-quit', () => {
  // Clean up all popout windows
  webcamPopoutWin?.close()
  aboutPopoutWin?.close()
  linkStatsPopoutWin?.close()
  
  // Kill backend process
  if (pythonBackend) {
    spawnSync('pkill', ['-f', 'fgcs_backend'])
  }
})
```

### Creating New Popout Windows

To add a new popout window:

1. **Create HTML file** (`gcs/newPopout.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <title>New Popout</title>
  <link rel="stylesheet" href="./css/popout.css">
</head>
<body>
  <div id="popout-content">
    <!-- Popout-specific content -->
  </div>
  <script src="./js/newPopout.js"></script>
</body>
</html>
```

2. **Add window creation function** (main.ts):
```typescript
let newPopoutWin: BrowserWindow | null = null

function createNewPopout() {
  newPopoutWin = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
  })
  
  const popoutUrl = `file://${path.join(__dirname, '../newPopout.html')}`
  newPopoutWin.loadURL(popoutUrl)
}
```

3. **Add IPC handlers**:
```typescript
ipcMain.handle('newPopout:open', () => {
  if (!newPopoutWin) createNewPopout()
  newPopoutWin?.show()
})

ipcMain.handle('newPopout:close', () => {
  newPopoutWin?.close()
  newPopoutWin = null
})
```

4. **Add renderer API** (preload.js):
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  newPopout: {
    open: () => ipcRenderer.invoke('newPopout:open'),
    close: () => ipcRenderer.invoke('newPopout:close'),
  }
})
```

This architecture provides a flexible foundation for building complex drone ground control interfaces with excellent separation of concerns and robust state management.