from __future__ import annotations

import time
from typing import TYPE_CHECKING, List, Union

import serial
from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


FLIGHT_MODES = [
    "FLTMODE1",
    "FLTMODE2",
    "FLTMODE3",
    "FLTMODE4",
    "FLTMODE5",
    "FLTMODE6",
]


class FlightModesController:
    def __init__(self, drone: Drone) -> None:
        """
        The flight modes class controls all flight mode related actions.

        Args:
            drone (Drone): The main drone object
        """

        self.drone = drone

        self.flight_modes: List[Union[str, float]] = []

        self.getFlightModes()
        self.getFlightModeChannel()

    def getFlightModes(self) -> None:
        """
        Get the current flight modes of the drone."""
        self.flight_modes = []
        for mode in FLIGHT_MODES:
            flight_mode = self.drone.paramsController.getSingleParam(mode)
            if flight_mode.get("success"):
                flight_mode_data = flight_mode.get("data")
                if flight_mode_data:
                    self.flight_modes.append(flight_mode_data.param_value)
            else:
                self.drone.logger.error(flight_mode.get("message"))
                self.flight_modes.append("UNKNOWN")

    def getFlightModeChannel(self) -> None:
        """
        Get the flight mode channel of the drone."""
        self.flight_mode_channel = "UNKNOWN"
        flight_mode_channel = self.drone.paramsController.getSingleParam("FLTMODE_CH")

        if flight_mode_channel.get("success"):
            flight_mode_channel_data = flight_mode_channel.get("data")
            if flight_mode_channel_data:
                self.flight_mode_channel = flight_mode_channel_data.param_value
        else:
            self.drone.logger.error(flight_mode_channel.get("message"))

    def refreshData(self) -> None:
        """
        Refresh the flight mode data."""
        self.getFlightModes()
        self.getFlightModeChannel()

    def setFlightMode(self, mode_number: int, flight_mode: int) -> Response:
        """
        Set the flight mode of the drone.

        Args:
            mode_number (int): The flight mode number
            flight_mode (int): The flight mode to set
        Returns:
            A message showing if the flight mode number was successfully set to the flight mode
        """

        if mode_number < 1 or mode_number > 6:
            self.drone.logger.error(
                "Invalid flight mode number, must be between 1 and 6 inclusive."
            )
            return {
                "success": False,
                "message": f"Invalid flight mode number, must be between 1 and 6 inclusive, got {mode_number}.",
            }

        param_type = 2

        param_set_success = self.drone.paramsController.setParam(
            f"FLTMODE{mode_number}", flight_mode, param_type
        )

        if self.drone.aircraft_type == 1:
            if (flight_mode < 0) or (flight_mode > 24):
                return {
                    "success": False,
                    "message": f"Invalid plane flight mode, must be between 0 and 24 inclusive, got {flight_mode}",
                }
            mode_name = mavutil.mavlink.enums["PLANE_MODE"][flight_mode].name
        else:
            if (flight_mode < 0) or (flight_mode > 27):
                return {
                    "success": False,
                    "message": f"Invalid copter flight mode, must be between 0 and 27 inclusive, got {flight_mode}",
                }
            mode_name = mavutil.mavlink.enums["COPTER_MODE"][flight_mode].name

        if param_set_success:
            self.drone.logger.info(f"Flight mode {mode_number} set to {mode_name}")
            self.flight_modes[mode_number - 1] = flight_mode

            return {
                "success": True,
                "message": f"Flight mode {mode_number} set to {mode_name}",
            }
        else:
            return {
                "success": False,
                "message": f"Failed to set flight mode {mode_number} to {mode_name}",
            }

    def setCurrentFlightMode(self, flightMode: int) -> Response:
        """
        Sends a Mavlink message to the drone for setting its current flight mode

        Args:
            flightmode (int): The numeric value for the current flight mode setting
        Returns:
            A message to show if the drone recieved the message and succesfully set the new mode
        """
        self.drone.is_listening = False
        time.sleep(0.3)
        self.drone.sendCommand(
            message=mavutil.mavlink.MAV_CMD_DO_SET_MODE,
            param1=1,
            param2=flightMode,
            param3=0,
            param4=0,
            param5=0,
            param6=0,
            param7=0,
        )

        try:
            response = self.drone.master.recv_match(
                type="COMMAND_ACK", blocking=True, timeout=3
            )
            print(response)

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_SET_MODE):
                self.drone.is_listening = True
                self.drone.logger.info("Flight mode set successfully")
                return {"success": True, "message": "Flight mode set successfully"}
            else:
                self.drone.is_listening = True
                return {
                    "success": False,
                    "message": "Could not set flight mode",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not set flight mode, serial exception",
            }
