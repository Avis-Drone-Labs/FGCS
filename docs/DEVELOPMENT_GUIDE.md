# Development Guide

This comprehensive guide covers the development workflow, coding standards, testing practices, and deployment procedures for the FGCS project.

## Quick Start for New Developers

### Prerequisites

1. **Node.js** (version >= 20.10.0)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **Yarn** (package manager)
   - Install: `npm install --global yarn`
   - Verify: `yarn --version`

3. **Python 3.11.9**
   - Download from [python.org](https://www.python.org/downloads/release/python-3119/)
   - Verify: `python --version`

4. **Docker** (for SITL simulator)
   - Download from [docker.com](https://www.docker.com/)
   - Verify: `docker --version`

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Avis-Drone-Labs/FGCS.git
   cd FGCS
   ```

2. **Set up Python virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   cd radio
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies:**
   ```bash
   cd ../gcs
   yarn install
   ```

5. **Configure environment variables:**
   ```bash
   cp .env_sample .env
   # Edit .env with your API keys
   ```

6. **Install pre-commit hooks:**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

### Running the Application

#### Method 1: Using Scripts (Recommended)

**Windows:**
```bash
# First time setup
./run.bat /path/to/venv update

# Subsequent runs
./run.bat /path/to/venv
```

**Linux/Mac:**
```bash
./run.bash
```

#### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd radio
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd gcs
yarn dev
```

**Terminal 3 - SITL Simulator (Optional):**
```bash
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl
```

## Development Workflow

### Git Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/new-feature-name
   # Create PR on GitHub
   ```

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks

Examples:
```
feat: add parameter validation to paramsController
fix: resolve connection timeout in drone.py
docs: update API endpoint documentation
test: add unit tests for mission upload
```

## Code Standards

### Python Code Style

We use **Ruff** for Python code formatting and linting:

```bash
# Format code
ruff format .

# Check for linting issues
ruff check .

# Fix auto-fixable issues
ruff check --fix .
```

**Key Python Conventions:**
- Use type hints for function parameters and return values
- Follow PEP 8 naming conventions
- Use docstrings for classes and public methods
- Maximum line length: 88 characters
- Use f-strings for string formatting

Example:
```python
from typing import Optional, List
from app.customTypes import Response

class ParamsController:
    """Controller for managing drone parameters."""
    
    def setParam(
        self, 
        param_name: str, 
        param_value: float, 
        param_type: int,
        retries: int = 3
    ) -> bool:
        """
        Set a drone parameter value.
        
        Args:
            param_name: Parameter identifier
            param_value: New parameter value
            param_type: MAVLink parameter type
            retries: Number of retry attempts
            
        Returns:
            True if parameter was set successfully
        """
        for attempt in range(retries):
            # Implementation here
            pass
        return False
```

### JavaScript/TypeScript Code Style

We use **Prettier** and **ESLint**:

```bash
cd gcs

# Format code
yarn format

# Check linting
yarn lint

# Fix auto-fixable issues
yarn lint:fix
```

**Key JavaScript Conventions:**
- Use camelCase for variables and functions
- Use PascalCase for components and classes
- Prefer const over let, avoid var
- Use arrow functions for callbacks
- Use meaningful component and variable names

Example:
```javascript
import { useSelector, useDispatch } from 'react-redux'
import { selectConnectedToDrone, emitConnectToDrone } from '../redux/slices/droneConnectionSlice'

function ConnectionButton() {
  const dispatch = useDispatch()
  const isConnected = useSelector(selectConnectedToDrone)
  
  const handleConnect = () => {
    dispatch(emitConnectToDrone())
  }
  
  return (
    <button 
      onClick={handleConnect}
      disabled={isConnected}
      className="connection-button"
    >
      {isConnected ? 'Connected' : 'Connect'}
    </button>
  )
}

export default ConnectionButton
```

## Testing

### Backend Testing

Backend tests use **pytest** with MAVLink simulation:

```bash
cd radio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_params.py

# Run with physical device
pytest --fc -s

# Run specific test
pytest -k "test_param_set"

# Generate coverage report
pytest --cov=app --cov-report=html
```

#### Writing Backend Tests

Test structure example:
```python
import pytest
from flask_socketio.test_client import SocketIOTestClient
from . import falcon_test
from .helpers import FakeTCP, send_and_receive

@falcon_test()
def test_parameter_set(socketio_client: SocketIOTestClient):
    """Test parameter setting functionality."""
    # Arrange
    param_data = {
        'param_name': 'TEST_PARAM',
        'param_value': 100.0,
        'param_type': 9  # REAL32
    }
    
    # Act
    response = send_and_receive(
        socketio_client,
        'set_parameter',
        param_data,
        'parameter_set_result'
    )
    
    # Assert
    assert response['success'] is True
    assert response['param_name'] == 'TEST_PARAM'
    assert abs(response['param_value'] - 100.0) < 0.001
```

#### Test Helpers

Common test utilities in `tests/helpers.py`:
```python
def send_and_receive(client, emit_event, emit_data, receive_event, timeout=5):
    """Send Socket.IO event and wait for response."""
    client.emit(emit_event, emit_data)
    received = client.get_received(timeout=timeout)
    
    for message in received:
        if message['name'] == receive_event:
            return message['args'][0]
    
    raise TimeoutError(f"No {receive_event} received within {timeout}s")
```

### Frontend Testing

Frontend tests use **Playwright** for end-to-end testing:

```bash
cd gcs

# Install Playwright browsers
npx playwright install

# Run tests
yarn test

# Run tests in headed mode
yarn test:headed

# Run specific test
npx playwright test dashboard.spec.ts

# Generate test report
npx playwright show-report
```

#### Writing Frontend Tests

Example test file:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })
  
  test('should display connection status', async ({ page }) => {
    // Check if connection indicator is visible
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toBeVisible()
    
    // Should show disconnected state initially
    await expect(connectionStatus).toHaveText('Disconnected')
  })
  
  test('should open connection modal', async ({ page }) => {
    // Click connect button
    await page.click('[data-testid="connect-button"]')
    
    // Check if modal opens
    const modal = page.locator('[data-testid="connection-modal"]')
    await expect(modal).toBeVisible()
  })
})
```

### Test Data and Fixtures

#### Backend Test Fixtures

Located in `radio/tests/conftest.py`:
```python
@pytest.fixture(scope="session")
def test_drone():
    """Create test drone instance."""
    drone = Drone("tcp:127.0.0.1:5760")
    yield drone
    drone.disconnect()

@pytest.fixture
def mock_mavlink_message():
    """Create mock MAVLink message."""
    class MockMessage:
        def __init__(self):
            self.param_id = "TEST_PARAM"
            self.param_value = 100.0
            self.param_type = 9
            
        def get_type(self):
            return "PARAM_VALUE"
    
    return MockMessage()
```

#### Mission Test Files

Sample mission files in `radio/tests/mission_test_files/`:
```python
# upload_mission_helper.py
def create_test_mission():
    """Create a basic test mission."""
    return [
        {
            'seq': 0,
            'frame': 3,  # MAV_FRAME_GLOBAL_RELATIVE_ALT
            'command': 22,  # MAV_CMD_NAV_TAKEOFF
            'current': 0,
            'autocontinue': 1,
            'param1': 0,  # pitch
            'param2': 0,  # empty
            'param3': 0,  # empty
            'param4': 0,  # yaw
            'x': 0,       # lat
            'y': 0,       # lon
            'z': 10,      # alt
        },
        # Additional waypoints...
    ]
```

## Debugging

### Backend Debugging

#### Using Python Debugger

```python
import pdb

def problematic_function():
    pdb.set_trace()  # Set breakpoint
    # Your code here
```

#### Logging Configuration

```python
import logging

# Configure logging level
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("fgcs")

# Use in code
logger.debug("Detailed debugging information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred")
```

#### MAVLink Message Debugging

```python
def debug_mavlink_messages(self):
    """Log all incoming MAVLink messages."""
    while True:
        msg = self.master.recv_match(blocking=True)
        if msg:
            self.logger.debug(f"Received: {msg.get_type()} - {msg}")
```

### Frontend Debugging

#### Browser DevTools

- **React DevTools**: Inspect component state and props
- **Redux DevTools**: Monitor state changes and actions
- **Network Tab**: Debug Socket.IO communication
- **Console**: View application logs

#### React Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong: {this.state.error?.message}</div>
    }
    
    return this.props.children
  }
}
```

#### Redux State Debugging

```javascript
// Enable Redux DevTools
const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
})

// Log state changes
store.subscribe(() => {
  console.log('State updated:', store.getState())
})
```

### Electron Debugging

#### Main Process Debugging

```bash
# Start with Node.js debugging
yarn electron:dev --inspect=5858

# Attach debugger in VS Code or Chrome DevTools
```

#### Renderer Process Debugging

```javascript
// In preload script
window.electronAPI = {
  debug: {
    log: (message) => console.log('[Electron]', message),
    error: (error) => console.error('[Electron]', error),
  }
}
```

## Performance Optimization

### Backend Performance

#### Connection Optimization

```python
# Optimize data stream rates
DATASTREAM_RATES_OPTIMIZED = {
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA1: 10,  # Attitude (critical)
    mavutil.mavlink.MAV_DATA_STREAM_POSITION: 5,  # GPS
    mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS: 2,  # Status
    mavutil.mavlink.MAV_DATA_STREAM_EXTRA3: 1,  # Battery
}

# Use connection pooling for multiple drones
class DroneManager:
    def __init__(self):
        self.connections = {}
        self.max_connections = 10
```

#### Memory Management

```python
# Limit message history
def manage_message_buffer(self):
    if len(self.message_history) > MAX_MESSAGES:
        self.message_history = self.message_history[-MAX_MESSAGES//2:]
        
# Use weak references for callbacks
import weakref

class Controller:
    def __init__(self, drone):
        self._drone_ref = weakref.ref(drone)
        
    @property
    def drone(self):
        return self._drone_ref()
```

### Frontend Performance

#### Component Optimization

```javascript
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive components
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item))
  }, [data])
  
  const handleUpdate = useCallback((id) => {
    onUpdate(id)
  }, [onUpdate])
  
  return <div>{/* Component content */}</div>
})

// Use React.lazy for code splitting
const MissionPlanner = lazy(() => import('./components/missions/MissionPlanner'))
```

#### Redux Performance

```javascript
// Normalize state structure
const initialState = {
  params: {
    byId: {},
    allIds: [],
  },
  ui: {
    selectedParamId: null,
    filters: {},
  }
}

// Use createEntityAdapter
import { createEntityAdapter } from '@reduxjs/toolkit'

const paramsAdapter = createEntityAdapter({
  selectId: (param) => param.param_id,
  sortComparer: (a, b) => a.param_id.localeCompare(b.param_id),
})

const initialState = paramsAdapter.getInitialState()
```

#### Bundle Optimization

```javascript
// vite.config.mts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@mantine/core', '@mantine/hooks'],
        },
      },
    },
  },
})
```

## Deployment

### Development Build

```bash
# Backend packaging
cd radio
pyinstaller --paths ./venv/lib/python3.11/site-packages/ \
  --add-data="./venv/lib/python*/site-packages/pymavlink/message_definitions:message_definitions" \
  --hidden-import pymavlink \
  --windowed \
  --name fgcs_backend \
  ./app.py

# Frontend build
cd ../gcs
yarn build
```

### Production Build

```bash
# Build for distribution
cd gcs
yarn build:electron

# Create installer (Windows)
yarn dist:win

# Create installer (macOS)
yarn dist:mac

# Create installer (Linux)
yarn dist:linux
```

### CI/CD Pipeline

GitHub Actions workflow example:

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd radio
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd radio
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd gcs
          yarn install
      - name: Run tests
        run: |
          cd gcs
          yarn test

  build:
    needs: [test-backend, test-frontend]
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - name: Build application
        run: |
          # Build steps for each platform
```

## Troubleshooting

### Common Issues

#### Backend Issues

**Connection Timeouts:**
```python
# Increase timeout values
self.master = mavutil.mavlink_connection(
    port, 
    timeout=10,  # Increase from default 5
    retries=5    # Increase retry attempts
)
```

**Parameter Fetch Failures:**
```python
# Add parameter request debugging
def debug_param_requests(self):
    self.logger.debug(f"Requesting param {self.current_param_index}/{self.total_number_of_params}")
    
    # Check for timeout
    if time.time() - self.param_request_start > 30:
        self.logger.error("Parameter request timeout")
        self.restart_param_fetch()
```

**Memory Leaks:**
```python
# Use context managers for resources
with self.command_lock:
    try:
        # Command execution
        pass
    finally:
        # Cleanup resources
        self.cleanup_command_resources()
```

#### Frontend Issues

**State Update Issues:**
```javascript
// Use immer for safe state updates
import { createSlice } from '@reduxjs/toolkit'

const slice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    updateData: (state, action) => {
      // Immer allows "mutating" draft state
      state.items.push(action.payload)
    }
  }
})
```

**Component Re-render Issues:**
```javascript
// Use React.memo with custom comparison
const MyComponent = memo(({ data, callbacks }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data.id === nextProps.data.id
})
```

### Development Environment Setup Issues

**Python Virtual Environment:**
```bash
# If venv creation fails
python -m pip install --upgrade pip
python -m pip install virtualenv
virtualenv venv
```

**Node.js Version Issues:**
```bash
# Use nvm to manage Node.js versions
nvm install 20.10.0
nvm use 20.10.0
```

**Docker Issues:**
```bash
# Reset Docker if containers fail to start
docker system prune -a
docker pull kushmakkapati/ardupilot_sitl
```

This development guide provides a comprehensive foundation for contributing to the FGCS project. For specific questions or issues not covered here, please check the GitHub discussions or create an issue.