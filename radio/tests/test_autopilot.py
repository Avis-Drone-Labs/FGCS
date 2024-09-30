from flask_socketio.test_client import SocketIOTestClient

from . import falcon_test

@falcon_test()
def test_reboot_success(
    socketio_client : SocketIOTestClient
):
    """
        Tests if the autopilot has been rebooted
    """
    socketio_client.emit("reboot_autopilot")
    socketio_result = socketio_client.get_received()
    assert socketio_result[-1]["name"] == "reboot_autopilot"
    assert socketio_result[-1]["args"][0]["success"] == True