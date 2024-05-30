import app.droneStatus as droneStatus
from app import create_app, socketio

# from engineio import async_threading

app = create_app(debug=True)

if __name__ == "__main__":
    print("Starting backend")
    socketio.run(app, allow_unsafe_werkzeug=True)
    if droneStatus.drone:
        droneStatus.drone.close()
