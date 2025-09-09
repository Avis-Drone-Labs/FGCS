import os
import app.droneStatus as droneStatus
from app import create_app, socketio, logger
from pathlib import Path
from dotenv import load_dotenv

app = create_app(debug=True)

if __name__ == "__main__":
    logger.info("Loading dotenv.")
    env_path = Path("../gcs/.env")
    load_dotenv(dotenv_path=env_path)

    if os.getenv("VITE_BACKEND_URL") is not None:
        url = os.getenv("VITE_BACKEND_URL").split("://")[-1]
        port = url.split(":")[-1]
        host = url.split(":")[0]
    else:
        port = 4237
        host = "127.0.0.1"

    logger.info(f"Starting backend at {host}:{port}.")
    socketio.run(app, allow_unsafe_werkzeug=True, host=host, port=port)

    if droneStatus.drone:
        droneStatus.drone.close()
        logger.info("Backend closed.")
