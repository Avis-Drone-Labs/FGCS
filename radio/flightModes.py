from __future__ import annotations

from typing import TYPE_CHECKING

import serial
from app.customTypes import Response
from pymavlink import mavutil

if TYPE_CHECKING:
    from radio.app.drone import Drone


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

        self.getFlightModes()
        self.getFlightModeChannel()

    def getFlightModes(self) -> None:
        """Get the current flight modes of the drone."""
        self.flight_modes = []
        for mode in FLIGHT_MODES:
            flight_mode = self.drone.getSingleParam(mode)
            if flight_mode.get("success"):
                self.flight_modes.append(flight_mode.get("data").param_value)
            else:
                print(flight_mode.get("message"))
                self.flight_modes.append("UNKNOWN")

    def getFlightModeChannel(self) -> None:
        """Get the flight mode channel of the drone."""
        self.flight_mode_channel = "UNKNOWN"
        flight_mode_channel = self.drone.getSingleParam("FLTMODE_CH")

        if flight_mode_channel.get("success"):
            self.flight_mode_channel = flight_mode_channel.get("data").param_value
        else:
            print(flight_mode_channel.get("message"))

    def refreshData(self) -> None:
        """Refresh the flight mode data."""
        self.getFlightModes()
        self.getFlightModeChannel()

    def setFlightMode(self, mode_number: int, flight_mode: int) -> Response:
        """Set the flight mode of the drone.

        Args:
            mode_number (int): The flight mode number
            flight_mode (int): The flight mode to set
        Returns:
            A message showing if the flight mode number was successfully set to the flight mode
        """

        if mode_number < 1 or mode_number > 6:
            print("Invalid flight mode number, must be between 1 and 6 inclusive.")
            return

        param_type = 2

        param_set_success = self.drone.setParam(
            f"FLTMODE{mode_number}", flight_mode, param_type
        )

        if param_set_success:
            print(
                f"Flight mode {mode_number} set to {mavutil.mavlink.enums['COPTER_MODE'][flight_mode].name}"
            )
            self.flight_modes[mode_number - 1] = flight_mode

            return {
                "success": True,
                "message": f"Flight mode {mode_number} set to {mavutil.mavlink.enums['COPTER_MODE'][flight_mode].name}",
            }
        else:
            return {
                "success": False,
                "message": f"Failed to set flight mode {mode_number} to {mavutil.mavlink.enums['COPTER_MODE'][flight_mode].name}",
            }

    def setCurrentFlightMode(self, flightMode: int) -> Response:
        """
        Sends a Mavlink message to the drone for setting its current flight mode

        Args:
            flightmode (int): The numeric value for the current flight mode setting
        Returns:
            A message to show if the drone recieved the message and succesfully set the new mode
        """
        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_DO_SET_MODE,
            param1=1,
            param2=flightMode,
            param3=0,
            param4=0,
            param5=0,
            param6=0,
            param7=0,
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK")

            if self.drone.commandAccepted(
                response, mavutil.mavlink.MAV_CMD_DO_SET_MODE
            ):
                return {"success": True, "message": "Flight mode set successfully"}
            else:
                return {
                    "success": False,
                    "message": "Could not set flight mode as active",
                }
        except serial.serialutil.SerialException:
            return {"success": False, "message": "Could not set flight mode as active"}
