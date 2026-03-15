import pytest
from app import create_app, socketio
from app.drone import Drone
from flask.testing import FlaskClient
from flask_socketio.test_client import SocketIOTestClient


def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line(
        "markers", "plane_only: mark test to run only on plane SITL"
    )
    config.addinivalue_line(
        "markers", "copter_only: mark test to run only on copter SITL"
    )


@pytest.fixture(scope="session", autouse=True)
def drone_status(request):
    """Create and provide the shared `droneStatus` module with an initialized Drone."""
    connection_string = "tcp:127.0.0.1:5760"

    tr = request.config.pluginmanager.getplugin("terminalreporter")
    if tr:
        tr.write_line("\033[1;31;40mRUNNING TESTS WITH SITL\033[0m")
    else:
        print("\033[1;31;40mRUNNING TESTS WITH SITL\033[0m")

    drone = Drone(connection_string)

    if drone.master is None:
        if tr:
            tr.write_line(
                "\033[1;31;40mFAILED TO CONNECT TO DRONE, EXITING TESTS\033[0m"
            )
        else:
            print("\033[1;31;40mFAILED TO CONNECT TO DRONE, EXITING TESTS\033[0m")
        pytest.exit(1)

    # Set the module-level droneStatus
    global droneStatus
    droneStatus.drone = drone

    try:
        yield droneStatus
    finally:
        # Teardown: try to close the connection
        try:
            if hasattr(drone, "close"):
                drone.close()
            elif hasattr(drone, "master") and hasattr(drone.master, "close"):
                drone.master.close()
        except Exception:
            pass
        if tr:
            tr.write_line("\033[1;31;40mTEARING DOWN\033[0m")
        else:
            print("\033[1;31;40mTEARING DOWN\033[0m")
        droneStatus.drone = None


@pytest.fixture(scope="session")
def app_instance():
    """Create the Flask app for tests (session scoped)."""
    app = create_app(debug=True)
    return app


@pytest.fixture(scope="session")
def flask_client(app_instance) -> FlaskClient:
    """Flask test client for the app (session scoped)."""
    return app_instance.test_client()


@pytest.fixture(scope="session")
def socketio_client(app_instance, flask_client) -> SocketIOTestClient:
    """SocketIO test client connected to the running app.

    Ensures the client is connected and tears down the connection at the end
    of the session.
    """
    client = socketio.test_client(app_instance, flask_test_client=flask_client)
    assert client.is_connected()
    yield client
    try:
        client.disconnect()
    except Exception:
        pass


@pytest.fixture(autouse=True)
def check_aircraft_type(request, drone_status):
    """Fixture to skip tests based on aircraft type markers.

    Depends on the `drone_status` session fixture so the drone connection
    is established before this autouse check runs.
    """

    markers = [marker.name for marker in request.node.iter_markers()]

    if getattr(drone_status, "drone", None) is None:
        pytest.skip("No drone connected")
        return

    aircraft_type = drone_status.drone.aircraft_type

    # Skip if marked as plane_only but not a plane
    if "plane_only" in markers and aircraft_type != 1:
        pytest.skip(f"Test requires plane SITL (current type: {aircraft_type})")

    # Skip if marked as copter_only but not a copter
    if "copter_only" in markers and aircraft_type != 2:
        pytest.skip(f"Test requires copter SITL (current type: {aircraft_type})")
