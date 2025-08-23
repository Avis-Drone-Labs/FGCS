import os
import app.droneStatus as droneStatus
from app import create_app, socketio
from pathlib import Path
from dotenv import load_dotenv

app = create_app(debug=True)

# DEBUG STATEMENT FOR TESTING #645

if __name__ == "__main__":
    print("Loading dotenv.")
    env_path = Path("../gcs/.env")
    load_dotenv(dotenv_path=env_path)

    if os.getenv("VITE_BACKEND_URL") is not None:
        url = os.getenv("VITE_BACKEND_URL").split("://")[-1]
        port = url.split(":")[-1]
        host = url.split(":")[0]
    else:
        port = 4237
        host = "127.0.0.1"

    print("Starting backend.")
    print(host)
    socketio.run(app, allow_unsafe_werkzeug=True, host=host, port=port)
    if droneStatus.drone:
        droneStatus.drone.close()
        print("Backend closed.")
