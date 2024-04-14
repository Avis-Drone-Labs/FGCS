from __future__ import annotations

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from drone import Drone


FLIGHT_MODES = [
    "FLTMODE1",
    "FLTMODE2",
    "FLTMODE3",
    "FLTMODE4",
    "FLTMODE5",
    "FLTMODE6",
]


class FlightModes:
    def __init__(self, drone: Drone) -> None:
        """The flight modes class controls all flight mode related actions.

        Args:
            drone (Drone): The main drone object
        """

        self.drone = drone

        self.flight_modes = []

        for mode in FLIGHT_MODES:
            flight_mode = self.drone.getSingleParam(mode)
            if flight_mode.get("success"):
                self.flight_modes.append(flight_mode.get("data").param_value)
            else:
                print(flight_mode.get("message"))
                self.flight_modes.append("UNKNOWN")

        self.flight_mode_channel = "UNKNOWN"
        flight_mode_channel = self.drone.getSingleParam("FLTMODE_CH")

        if flight_mode_channel.get("success"):
            self.flight_mode_channel = flight_mode_channel.get("data").param_value
        else:
            print(flight_mode_channel.get("message"))
