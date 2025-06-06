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
  echo "Virtual environment not found at $venv_path, creating..."
  python3.11 -m venv "$venv_path"
fi

# activate the virtual environment
. "$venv_path/bin/activate"

cd radio || exit 1
pip install -r requirements.txt
cd ../gcs || exit 1
yarn
