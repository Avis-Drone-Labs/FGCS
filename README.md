# FGCS

Falcon Ground Control Station. Learn more on our [website](https://fgcs.projectfalcon.uk)!

![UI Screenshot](ui.png)

## How to update

When adding a new folder please write up about it in the correct README.md and also ask for permission with folders (this is so that we don't end up with clutter, you will most likely be allowed to add it).

## How to run

### Prerequsits 

1. Ensure npm is installed, to do so follow [this guide](https://kinsta.com/blog/how-to-install-node-js/). Note: node version must be >= v20.10.0
2. Ensure yarn is installed, to do so run `npm install --global yarn` or follow [this guide](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)

### Running Frontend Manually

1. `cd gcs`
2. `yarn` (to install dependencies)
3. `yarn dev`

### Running Backend Manually

1. `cd radio`
2. Make sure you're in a virtual environment and all dependencies are installed using `pip install -r requirements.txt`
3. `python app.py`

#### Creating a virtual environment

Create a new Python virtual environment using `python -m venv venv`. This can then be activated using `./venv/scripts/activate`.

### Running both simultaneously

To run both the frontend and backend at the same time, you need to make sure all the requirements are installed for both yarn and Python. Then you can install a script globally using `npm install -g concurrently`. After activating your Python virtual environment, you can run `./run.bat` and this should start up both the frontend and backend in one terminal.

## Stack

- GUI
  - Electron + Vite + React (JavaScript)
- Backend
  - Flask (Python)

## Python Version

We are going to be using **python 3.11.x** so please install that on your computer from [Python's website](https://www.python.org/downloads/). Please try to use a virtual environment when programming, if you don't know how to do this please message me (Julian)! Name the folder either "env" or "venv" so its in the .gitignore as we don't want to be uploading that to github.

## Python Code Style

We will be using `ruff` as the code style for python, please look at the documentation found [here](https://docs.astral.sh/ruff/). When pushing code we have an action to check if it is in the correct code style, if it is not in the correct style it will fail the run and you will need to fix it by running `python -m ruff format .` in your virtual environment (or something `ruff format .` works on different systems); this should automatically reformat everything so you can push it again!

## Pre-commit

When cloning the repo for the first time, please install `pre-commit`. This can be done with a simple `pip install pre-commit` and then `pre-commit install`. Our pre-commit hooks will run every time you try to push something, if any of the checks fail then you will not be able to push that commit and receive an error message, often the files will be fixed but not staged, so make sure to re-stage and retry the with pushing commit.

## Packaging

### Backend

From within the `radio` folder run `pyinstaller --paths .\venv\Lib\site-packages\ --add-data=".\venv\Lib\site-packages\pymavlink\message_definitions\:message_definitions" --add-data=".\venv\Lib\site-packages\pymavlink\:pymavlink" --hidden-import pymavlink .\app.py -n fgcs_backend`. This will create an exe and folder within the `dist/fgcs_backend/` folder.

### Frontend

After compiling the backend, place the contents of `radio/dist/fgcs_backend` into a folder in `gcs/extras`. Then from within the `gcs` folder run `yarn build`.
