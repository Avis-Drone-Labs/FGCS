import app.droneStatus as droneStatus
from app import create_app, socketio

app = create_app(debug=True)

if __name__ == "__main__":
    print("Starting backend")
    socketio.run(app, allow_unsafe_werkzeug=True, port=4237)
    if droneStatus.drone:
        droneStatus.drone.close()
