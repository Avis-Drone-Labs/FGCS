# FGCS

Falcon Ground Control Station.

> Learn more on our [website](https://fgcs.projectfalcon.uk)!

![UI Screenshot](ui.webp)

---

## How to run

<details><summary>Windows - Installation</summary>

1. Go to [releases](https://github.com/Avis-Drone-Labs/FGCS/releases) and download the most recent versions `.exe` file
2. Run the downloaded file, you may have to click "more" then "run anyway" if windows defender blocks it
3. Once installed it should be accessible via the start menu as "FGCS"

</details>

<details><summary>Windows - Manually</summary>

### Prerequisites

1. Ensure npm is installed, to do so follow [this guide](https://kinsta.com/blog/how-to-install-node-js/). Note: node version must be >= v20.10.0
2. Ensure yarn is installed, to do so run `npm install --global yarn` or follow [this guide](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
3. Install `python 3.11.9` (this can be found [here](https://www.python.org/downloads/release/python-3119/)) then create a virtual environment for it (see [Creating a virtual environment](#creating-a-virtual-environment) for help)

#### Creating a virtual environment

Create a new Python virtual environment using `python -m venv venv`. This can then be activated using `./venv/scripts/activate`.

> NOTE: To enter the virtual environment you will need to run `venv/Scripts/activate` on windows, to learn more please read: [how to make venv for linux and windows](https://www.geeksforgeeks.org/creating-python-virtual-environment-windows-linux/) or [what is a virtual environment?](https://docs.python.org/3/library/venv.html)


<details><summary>Running with bat file</summary>

1. If this is your first time running, please create a venv (see [Creating a virtual environment](#creating-a-virtual-environment)) and then run `./run.bat /path/to/venv update`
2. After this you can run `./run.bat /path/to/venv` (without the word update after)

</details>

<details><summary>Running independently</summary>

### Frontend

1. `cd gcs`
2. `yarn` (to install dependencies)
3. Create a `.env` file and add these two entries or rename `.env_sample` and populate the values:
   - `VITE_MAPTILER_API_KEY=` + Your maptiler API key (can be generated [on maptilers website](https://cloud.maptiler.com/account/keys))
   - `VITE_BACKEND_URL=http://127.0.0.1:4237` (if you want to change the port and host see: [Configuration > Changing Ports](#Configuration))
5. `yarn dev`

### Backend

1. `cd radio`
2. Make sure you're in a virtual environment (see [Creating a virtual environment](#creating-a-virtual-environment))
3. Install requirements `pip install -r requirements.txt`
4. `python app.py`

### Parameter Definitions (Optional)

To generate the latest parameter definitions for drone parameters:

1. `cd gcs/data`
2. `python generate_param_definitions.py`

This will download and generate the latest parameter definition files for ArduCopter and ArduPlane from the ArduPilot project. These files help the frontend display parameter descriptions and metadata.

</details>

---

</details>

<details><summary>Mac/Linux</summary>

We currently don't have instructions or releases for mac or linux, we will in future releases. It does run on ubuntu and mac as members of the team use it, but we want to test the instructions before releasing them. However, you can still run both the frontend and backend individually by following the windows version with slight alterations to the commands.

</details>

---

## Development Info

<details><summary>Stack</summary>

- GUI
  - Electron + Vite + React (JavaScript)
- Backend
  - Flask + Pymavlink (Python)

</details>

<details><summary>Running tests</summary>

## Backend Tests

For running Python tests, first make sure you're in the `radio` directory and your virtual environment is activated.

### Prerequisites
1. Ensure you have pytest installed: `pip install pytest`
2. Have a running SITL simulator or physical drone connected

### Test Options

**Option 1: Using Docker SITL (Recommended)**
1. Start the SITL simulator: `docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl`
2. Run tests: `pytest`

**Option 2: Using Physical Device**
1. Connect your drone via USB/serial
2. Run tests with device selection: `pytest --fc -s`
3. Select the correct COM port when prompted

**Option 3: Run Specific Test Categories**
```bash
pytest tests/test_params.py          # Parameter-related tests
pytest tests/test_mission.py         # Mission planning tests
pytest tests/test_arm.py            # Arming/disarming tests
pytest -v                          # Verbose output
pytest -k "test_name"               # Run specific test
```

## Frontend Tests

Frontend tests use Playwright for end-to-end testing:

1. `cd gcs`
2. Install dependencies: `yarn`
3. Install Playwright browsers: `npx playwright install`
4. Run tests: `yarn test` or `npx playwright test`

Note: Frontend tests are currently minimal and being expanded.

</details>

<details><summary>SITL Simulator Setup</summary>

The Software-in-the-Loop (SITL) simulator allows you to test FGCS without physical hardware.

## Quick Start with Docker

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

## Advanced SITL Configuration

### Different Vehicle Types
```bash
# ArduPlane
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl VEHICLE=ArduPlane

# ArduRover  
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl VEHICLE=ArduRover

# ArduSub
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl VEHICLE=ArduSub
```

### Custom Starting Location
```bash
docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl \
  VEHICLE=ArduCopter LAT=-35.363261 LON=149.165230 ALT=584 DIR=353
```

### Multiple Ports (for concurrent connections)
```bash
docker run -it --rm -p 5760:5760 -p 5763:5763 kushmakkapati/ardupilot_sitl
```

### Custom Parameters and Missions
1. **Create files in your working directory:**
   - `custom_params.parm` - Custom parameter file
   - `mission.txt` - Mission waypoints file

2. **Mount files into container:**
   ```bash
   docker run -it --rm -p 5760:5760 -p 5763:5763 \
     -v .:/sitl_setup/custom kushmakkapati/ardupilot_sitl VEHICLE=ArduPlane
   ```

## Alternative SITL Setup (without Docker)

If you prefer to install ArduPilot SITL natively:

1. **Install ArduPilot SITL** (follow [ArduPilot documentation](https://ardupilot.org/dev/docs/setting-up-sitl-on-linux.html))
2. **Start simulator:**
   ```bash
   sim_vehicle.py -v ArduCopter --console --map --out=127.0.0.1:5760
   ```

## Connecting FGCS to SITL

1. Start the backend with connection string: `tcp:127.0.0.1:5760`
2. Or use the GUI connection dialog in FGCS to connect to `tcp:127.0.0.1:5760`

</details>

<details><summary>Python</summary>

## Version

We are going to be using **python 3.11.x** so please install that on your computer from [Python's website](https://www.python.org/downloads/). Please try to use a virtual environment when programming, if you don't know how to do this please message me (Julian)! Name the folder either "env" or "venv" so its in the .gitignore as we don't want to be uploading that to github.

## Code Style

We will be using `ruff` as the code style for python, please look at the documentation found [here](https://docs.astral.sh/ruff/). When pushing code we have an action to check if it is in the correct code style, if it is not in the correct style it will fail the run and you will need to fix it by running `python -m ruff format .` in your virtual environment (or something `ruff format .` works on different systems); this should automatically reformat everything so you can push it again!

</details>

<details><summary>Pre-Commit</summary>

When cloning the repo for the first time, please install `pre-commit`. This can be done with a simple `pip install pre-commit` and then `pre-commit install`. Our pre-commit hooks will run every time you try to push something, if any of the checks fail then you will not be able to push that commit and receive an error message, often the files will be fixed but not staged, so make sure to re-stage and retry the with pushing commit.

</details>

<details><summary>Packaging</summary>

## Backend

From within the `radio` folder run `pyinstaller --paths .\venv\Lib\site-packages\ --add-data=".\venv\Lib\site-packages\pymavlink\message_definitions\:message_definitions" --add-data=".\venv\Lib\site-packages\pymavlink\:pymavlink" --hidden-import pymavlink --hidden-import engineio.async_drivers.threading .\app.py -n fgcs_backend`. This will create an exe and folder within the `dist/fgcs_backend/` folder.

On Mac:
From within the `radio` folder run
`pyinstaller --paths ./venv/lib/python3.11/site-packages/ --add-data="./venv/lib/python*/site-packages/pymavlink/message_definitions:message_definitions" --add-data="./venv/lib/python*/site-packages/pymavlink:pymavlink" --hidden-import pymavlink --hidden-import engineio.async_drivers.threading --windowed --name fgcs_backend ./app.py`.
This will create the `dist/fgcs_backend.app/` folder. 

## Frontend

After compiling the backend, place the contents of `radio/dist/fgcs_backend` into a folder in `gcs/extras`. Then from within the `gcs` folder run `yarn build`.

On Mac:
After compiling the backend, copy the `radio/dist/fgcs_backend.app` directory and move it to `gcs/extras`. Then from within the `gcs` folder run `yarn build`. Install from the .dmg file.

</details>

### Configuration

<details><summary>Changing Ports</summary>

We have an `.env` file located in `gcs/.env`. To change the host and port for the backend, please edit `VITE_BACKEND_URL`.

> Note: The default host and port is `http://127.0.0.1:4237`. 

</details>

---

---

## 📚 Documentation

For developers and advanced users, comprehensive technical documentation is available:

- **[📖 Complete Documentation Index](docs/README.md)** - Overview of all documentation
- **[🚀 Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup, workflow, and best practices
- **[🔧 Backend Architecture](docs/BACKEND_ARCHITECTURE.md)** - Controllers, endpoints, and MAVLink
- **[🖥️ Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)** - Redux, components, and popout windows
- **[📡 MAVLink Communication](docs/MAVLINK_COMMUNICATION.md)** - Drone communication and command lock

---

## Need Help?

Feel free to ask questions in the [discussion area](https://github.com/Avis-Drone-Labs/FGCS/discussions).
