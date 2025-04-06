source radio/venv/bin/activate
concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"