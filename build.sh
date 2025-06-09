#!/bin/sh

#--------------------------------------------------------.
# please run this script from the root of the repository .
#--------------------------------------------------------.

venv_path="$1"

if [ -z "$venv_path" ]; then
  venv_path="radio/venv"
fi

# create venv if not already created
if [ ! -d "$venv_path" ]; then
  echo "Virtual environment not found at $venv_path, run setup.sh first."
  exit 1
fi

# activate the virtual environment
. "$venv_path/bin/activate"

cd radio || exit 1

pyinstaller --paths ./venv/lib/python3.11/site-packages/ --add-data="./venv/lib/python3.11/site-packages/pymavlink/message_definitions:message_definitions" --add-data="./venv/lib/python3.11/site-packages/pymavlink:pymavlink" --hidden-import pymavlink --hidden-import engineio.async_drivers.threading --windowed --name fgcs_backend ./app.py

cd .. || exit 1

if [ "$(uname)" = "Darwin" ]; then
  mv radio/dist/fgcs_backend.app gcs/extras
else
  mv radio/dist/fgcs_backend gcs/extras
fi

cd gcs || exit 1

yarn build
