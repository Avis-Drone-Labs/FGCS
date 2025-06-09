#!/bin/sh

#--------------------------------------------------------.
# please run this script from the root of the repository .
#--------------------------------------------------------.

# check if virtual environment is provided
venv_path="$1"

if [ -z "$venv_path" ]; then
  venv_path="radio/venv"
fi

# create venv if not already created
if [ ! -d "$venv_path" ]; then
  echo "Virtual environment not found at $venv_path, run setup.sh first."
  exit 1
fi

if [ ! -d "gcs/node_modules" ]; then
  echo "Node modules not found, run setup.sh first."
  exit 1
fi

# activate the virtual environment
. "$venv_path/bin/activate"

# make sure concurrently is installed
if ! command -v concurrently >/dev/null 2>&1; then
  echo "concurrently could not be found, installing..."
  npm i -g concurrently
fi

concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
