from app import create_app, socketio
import app.droneStatus as droneStatus

app = create_app(debug=True)

if __name__ == "__main__":
    print(f"Starting backend")
    socketio.run(app, allow_unsafe_werkzeug=True)
    print(f"Backend started", flush=True)
    if droneStatus.drone:
        droneStatus.drone.close()
