#!/usr/bin/env bash
set -euo pipefail

# Build FGCS for macOS (arm64 by default). Run from any directory.
# Usage: ./build.sh <version>

if [[ ${1:-} == "" ]]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.2.0-alpha"
  exit 1
fi

VERSION="$1"

echo "Assuming location is FGCS/building/macos"
cd ../../

echo "Building backend"
cd radio
source ./venv/bin/activate
python3 -m pip show pyinstaller >/dev/null 2>&1 || python3 -m pip install pyinstaller

# Clean previous dist if present (pyinstaller asks otherwise)
rm -rf dist/fgcs_backend dist/fgcs_backend.app || true

# Build
pyinstaller \
  --paths ./venv/lib/python3.11/site-packages/ \
  --add-data="./venv/lib/python*/site-packages/pymavlink/message_definitions:message_definitions" \
  --add-data="./venv/lib/python*/site-packages/pymavlink:pymavlink" \
  --hidden-import pymavlink \
  --hidden-import engineio.async_drivers.threading \
  --windowed \
  --name fgcs_backend \
  ./app.py

# Move backend app bundle into gcs/extras
BACKEND_APP_PATH="dist/fgcs_backend.app"
EXTRAS_DIR="../gcs/extras"

rm -rf "$EXTRAS_DIR" && mkdir -p "$EXTRAS_DIR"
cp -R "$BACKEND_APP_PATH" "$EXTRAS_DIR/"

echo "Copied backend to ${EXTRAS_DIR}/fgcs_backend.app"

# Generate param definitions, then build frontend + Electron package (DMG)
cd ../gcs/data
python3 generate_param_definitions.py
echo "Generated param definitions"

cd ../
yarn
yarn version --new-version "$VERSION" --no-git-tag-version --no-commit-hooks
yarn build

echo "Build finished, check gcs/release/${VERSION} for output."
