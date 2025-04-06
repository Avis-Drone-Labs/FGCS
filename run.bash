#!/bin/sh

source radio/venv/bin/activate

# Check for updates
if [ -z "$1" ]; then 
    concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
else
    cd radio
    pip install -r requirements.txt
    cd ../
    concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
fi