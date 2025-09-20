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

## 📚 Documentation

For developers and advanced users, comprehensive technical documentation is available:

- **[📖 Complete Documentation Index](docs/README.md)** - Overview of all documentation
- **[🚀 Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup, workflow, and best practices
- **[🔧 Backend Architecture](docs/BACKEND_ARCHITECTURE.md)** - Controllers and system design
- **[🖥️ Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)** - Redux, components, and popout windows

---

## Need Help?

Feel free to ask questions in the [discussion area](https://github.com/Avis-Drone-Labs/FGCS/discussions).
