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

2. **Install pre-commit hooks:**

   ```bash
   pip install pre-commit
   pre-commit install
   ```

3. **Set up Python virtual environment:**

   ```bash
   cd radio
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate

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
   ```

6. **Add Maptiler API key**:
Edit the `.env` file to include your Maptiler API key, it can be generated [on maptilers website](https://cloud.maptiler.com/account/keys).

7. **Generate param definitions:**

    ```bash
    cd data
    python generate_param_definitions.py
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

### Running the Simulator

#### Quick Start with Docker

1. **Pull the SITL image:**

   ```bash
   docker pull kushmakkapati/ardupilot_sitl
   ```

2. **Start basic simulator (ArduCopter):**

   ```bash
   docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl
   ```

3. **Connect FGCS to simulator:**
   - Backend connection string: `tcp:127.0.0.1:5760`
   - This exposes the MAVLink connection on port 5760

#### Advanced SITL Configuration

##### Different Vehicle Types

```bash
# ArduPlane
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl VEHICLE=ArduPlane

# ArduRover
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl VEHICLE=ArduRover
```

##### Custom Starting Location

```bash
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl \
  VEHICLE=ArduCopter LAT=-35.363261 LON=149.165230 ALT=584 DIR=353
```

##### Multiple Ports (for concurrent connections)

```bash
docker run -it --rm -p 5760:5760 -p 5763:5763 kushmakkapati/ardupilot_sitl
```

##### Custom Parameters and Missions

1. **Create files in your working directory:**
   - `custom_params.parm` - Custom parameter file
   - `mission.txt` - Mission waypoints file

2. **Mount files into container:**

   ```bash
   docker run -it --rm -p 5760:5760 -p 5763:5763 \
     -v .:/sitl_setup/custom kushmakkapati/ardupilot_sitl VEHICLE=ArduPlane
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
