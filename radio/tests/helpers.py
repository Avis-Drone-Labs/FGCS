import pytest
from serial.serialutil import SerialException

from app import droneStatus, logger
from . import socketio_client


class FakeTCP:
    """
    Context manager that replaces the mavlink mavtcp recv_match method in `droneStatus.drone.master` with one that raises a
    `serial.serialutils.SerialException`. Use if you want to simulate a serial issue for a unit test.
    """

    @staticmethod
    def recv_match_override(
        condition=None, type=None, blocking=False, timeout=None
    ) -> None:
        raise SerialException(
            "Test SerialException generated by tests.FakeTCP context manager."
        )

    def __enter__(self) -> None:
        # Replace drone mavtcp recv_match function with one that raises SerialException
        if droneStatus.drone is not None:
            self.old_recv = droneStatus.drone.master.recv_match
            droneStatus.drone.master.recv_match = FakeTCP.recv_match_override

    def __exit__(self, type, value, traceback) -> None:
        # Reset recv_match method
        if droneStatus.drone is not None:
            droneStatus.drone.master.recv_match = self.old_recv


class NoDrone:
    """Context manager that sets the drone to `None` for the scope of the tests called within, then ensures the drone
    is returned to its previous state
    """

    def __enter__(self) -> None:
        if droneStatus.drone is None:
            logger.warning(
                "Calling NoDrone context manager when drone is already None."
            )
        self.oldDrone = droneStatus.drone
        droneStatus.drone = None

    def __exit__(self, type, value, traceback) -> None:
        droneStatus.drone = self.oldDrone


class ParamSetTimeout:
    """Context manager that replaces the mavlink recv_match function in drone.master with a function that return a None value
    to cause the set multipleparams function to timeout
    """

    @staticmethod
    def recv_match_null_value(
        condition=None, type=None, blocking=False, timeout=None
    ) -> None:
        return None

    def __enter__(self) -> None:
        if droneStatus.drone is not None:
            self.old_recv = droneStatus.drone.master.recv_match
            droneStatus.drone.master.recv_match = ParamSetTimeout.recv_match_null_value

    def __exit__(self, type, value, traceback) -> None:
        if droneStatus.drone is not None:
            droneStatus.drone.master.recv_match = self.old_recv


class ParamRefreshTimeout:
    """Context manager that replaces the mavlink recv_msg function in drone.master with a function that returns a False value
    and sets current_param_index to -1 to cause the refresh_params function to timeout with no params received from the drone
    """

    @staticmethod
    def recv_msg_false_value(
        condition=None, Type=None, blocking=False, timeout=None
    ) -> bool:
        return False

    def __enter__(self) -> None:
        if droneStatus.drone is not None:
            self.old_recv_msg = droneStatus.drone.master.recv_msg
            droneStatus.drone.master.recv_msg = ParamRefreshTimeout.recv_msg_false_value
            self.old_param_index = (
                droneStatus.drone.paramsController.current_param_index
            )
            droneStatus.drone.paramsController.current_param_index = -1

    def __exit__(self, type, value, traceback) -> None:
        if droneStatus.drone is not None:
            droneStatus.drone.master.recv_msg = self.old_recv_msg
            droneStatus.drone.paramsController.current_param_index = (
                self.old_param_index
            )


class NoAcknowledgementMessage:
    """Context manager that replaces the mavlink recv_match function in drone.master with a function that returns False
    causing no acknowledgement messages to be received when used in the MotorTestController tests
    """

    @staticmethod
    def recv_msg_false_value(
        condition=None, type=None, blocking=False, timeout=None
    ) -> bool:
        return False

    def __enter__(self) -> None:
        if droneStatus.drone is not None:
            self.old_recv = droneStatus.drone.master.recv_match
            droneStatus.drone.master.recv_match = (
                NoAcknowledgementMessage.recv_msg_false_value
            )

    def __exit__(self, type, value, traceback) -> None:
        if droneStatus.drone is not None:
            droneStatus.drone.master.recv_match = self.old_recv


def send_and_recieve(endpoint: str, args: dict | None | str = None) -> dict:
    """Sends a request to the socketio test client and returns the response

    Parameters
    ----------
    endpoint : str
        The endpoint to send the request to
    args : dict | None, optional
        The arguments to pass to the endpoint, by default None

    Returns
    -------
    dict
        The data recieved from the client
    """
    socketio_client.emit(endpoint, args) if args is not None else socketio_client.emit(
        endpoint
    )
    return socketio_client.get_received()[0]["args"][0]


@pytest.fixture
def gps_failure():
    """Fixture to use when you want the test being ran to simulate a GPS system failure.

    TODO: This does not work for some reason. Fix?
    """
    droneStatus.drone.logger.info("Enabling SIM_GPS_DISABLE")
    droneStatus.drone.master.param_set_send("SIM_GPS_DISABLE", 1.0, 2)
    droneStatus.drone.master.param_set_send("SIM_GPS2_DISABLE", 1.0, 2)

    yield

    droneStatus.drone.logger.info("Disabling SIM_GPS_DISABLE")
    droneStatus.drone.master.param_set_send("SIM_GPS_DISABLE", 0.0, 2)
    droneStatus.drone.master.param_set_send("SIM_GPS2_DISABLE", 0.0, 2)
