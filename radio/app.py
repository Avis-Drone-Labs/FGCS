import os
import app.droneStatus as droneStatus
from app import create_app, socketio
from pathlib import Path
from dotenv import load_dotenv

app = create_app(debug=True)

if __name__ == "__main__":
    print("Loading dotenv.")
    env_path = Path("../gcs/.env")
    load_dotenv(dotenv_path=env_path)
    port = (
        os.getenv("VITE_BACKEND_URL").split(":")[-1]
        if os.getenv("VITE_BACKEND_URL") is not None
        else 4237
    )

    print("Starting backend.")
    socketio.run(app, allow_unsafe_werkzeug=True, port=port)
    if droneStatus.drone:
        droneStatus.drone.close()
        print("Backend closed.")
