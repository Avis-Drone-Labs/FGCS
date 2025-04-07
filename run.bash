#!/bin/sh

source $1/bin/activate

# Check for updates
if [ -z "$2" ]; then 
    concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
else
    cd radio
    pip install -r requirements.txt
    cd ../
    concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
fi