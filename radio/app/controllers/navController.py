from __future__ import annotations

from typing import TYPE_CHECKING

import serial
from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


class NavController:
    def __init__(self, drone: Drone) -> None:
        """
        The Nav controller controls all navigation operations.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone

    def getHomePosition(self) -> Response:
        """
        Request the current home position from the drone.
        """
        self.drone.is_listening = False
        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_REQUEST_MESSAGE,
            param1=mavutil.mavlink.MAVLINK_MSG_ID_HOME_POSITION,
        )

        try:
            response = self.drone.master.recv_match(
                type="HOME_POSITION", blocking=True, timeout=3
            )
            self.drone.is_listening = True

            if response:
                self.drone.logger.info("Home position received")

                home_position = {
                    "lat": response.latitude,
                    "lon": response.longitude,
                    "alt": response.altitude,
                }

                return {
                    "success": True,
                    "message": "Home position received",
                    "data": home_position,
                }
            else:
                return {
                    "success": False,
                    "message": "Could not get home position",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not get home position, serial exception",
            }

    def setHomePosition(self, lat: float, lon: float, alt: float) -> Response:
        """
        Set the home point of the drone.

        Args:
            lat (float): The latitude of the home point
            lon (float): The longitude of the home point
            alt (float): The altitude of the home point
        """

        self.drone.is_listening = False
        self.drone.sendCommandInt(
            mavutil.mavlink.MAV_CMD_DO_SET_HOME, x=lat, y=lon, z=alt
        )

        try:
            response = self.drone.master.recv_match(
                type=[
                    "COMMAND_ACK",
                ],
                blocking=True,
                timeout=2,
            )
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_SET_HOME):
                return {
                    "success": True,
                    "message": "Home point set successfully",
                }

            else:
                return {
                    "success": False,
                    "message": "Could not set home point",
                }

        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not set home point, serial exception",
            }

    def takeoff(self, alt: float) -> Response:
        """
        Tells the drone to takeoff to a specified altitude.

        Args:
            alt (float): The altitude to take off to.

        Returns:
            Response: The response from the takeoff command
        """
        if alt < 0:
            return {
                "success": False,
                "message": f"Altitude cannot be negative, got {alt}",
            }

        guidedModeSetResult = self.drone.flightModesController.setGuidedMode()
        if not guidedModeSetResult["success"]:
            return guidedModeSetResult

        self.drone.is_listening = False

        self.drone.sendCommand(mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, param7=alt)

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_NAV_TAKEOFF):
                self.drone.is_listening = True
                self.drone.logger.info("Takeoff command send successfully")
                return {"success": True, "message": "Takeoff command sent successfully"}
            else:
                self.drone.is_listening = True
                return {
                    "success": False,
                    "message": "Could not takeoff",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not takeoff, serial exception",
            }

    def land(self) -> Response:
        """
        Tells the drone to land.

        Returns:
            Response: The response from the land command
        """
        self.drone.is_listening = False

        self.drone.sendCommand(mavutil.mavlink.MAV_CMD_NAV_LAND)

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_NAV_LAND):
                self.drone.logger.info("Land command send successfully")
                return {"success": True, "message": "Land command sent successfully"}
            else:
                return {
                    "success": False,
                    "message": "Could not land",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not land, serial exception",
            }

    def reposition(self, lat: float, lon: float, alt: float) -> Response:
        """
        Tells the drone to reposition to the specified GPS coordinates.

        Args:
            lat (float): The latitude to go to.
            lon (float): The longitude to go to.
            alt (float): The altitude to go to.

        Returns:
            Response: The response from the reposition command
        """
        self.drone.is_listening = False

        self.drone.sendCommandInt(
            message=mavutil.mavlink.MAV_CMD_DO_REPOSITION,
            param2=1,  # Change to Guided mode immediately
            x=lat,
            y=lon,
            z=alt,
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_DO_REPOSITION):
                self.drone.logger.info("Reposition command send successfully")
                return {
                    "success": True,
                    "message": "Reposition command sent successfully",
                    "data": {
                        "lat": lat,
                        "lon": lon,
                        "alt": alt,
                    },
                }
            else:
                return {
                    "success": False,
                    "message": "Could not reposition",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not reposition, serial exception",
            }
