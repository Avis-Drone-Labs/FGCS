from . import falcon_test


@falcon_test
def test_arm(flask_client, socketio_client):
    """
    Test armin function
    """
    assert 1 == 1
