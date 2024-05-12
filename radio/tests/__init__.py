# __init__.py holds all helper functions for all tests
from typing import Callable
from ..app import create_app, socketio

app = create_app(debug=True)
socketio = socketio


def falcon_test(test_func: Callable):
    """
    Useful wrapper for a test function on project falcon

    Args:
        test_func (callable): The function you want to test
    """

    def inner(*args, **kwargs):
        # log the user in through Flask test client
        flask_client = app.test_client()
        socketio_client = socketio.test_client(app, flask_test_client=flask_client)

        # make sure the server rejected the connection
        assert not socketio_client.is_connected()

        test_func(flask_client, socketio_client, *args, **kwargs)

    return inner
