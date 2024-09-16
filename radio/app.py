import os
import app.droneStatus as droneStatus
from app import create_app, socketio

app = create_app(debug=True)

if __name__ == "__main__":
    port = os.getenv("PORT") if os.getenv("PORT") is not None else 4237
    print("Starting backend")
    socketio.run(app, allow_unsafe_werkzeug=True, port=port)
    if droneStatus.drone:
        droneStatus.drone.close()
