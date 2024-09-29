from flask_socketio import SocketIOTestClient

from . import falcon_test
from .helpers import send_and_recieve, NoDrone

@falcon_test(pass_drone_status=True)
def test_setState(
    socketio_client: SocketIOTestClient,
    droneStatus
) -> None:

    # Failure on no drone connection
    with NoDrone():
        assert send_and_recieve("set_state", "dashboard") == {"message": "Must be connected to the drone to set the drone state."}

    # Failure on no state sent
    assert send_and_recieve("set_state", {}) == {"message": "Request to endpoint set_state missing value for parameter: state."}

    # Success on changing state to dashboard
