from __future__ import annotations

from threading import current_thread
from typing import TYPE_CHECKING

import serial
from app.customTypes import Response
from app.utils import commandAccepted, sendingCommandLock
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
        self.controller_id = f"nav_{current_thread().ident}"
        self.drone = drone

        self.loiter_radius_param_type = mavutil.mavlink.MAV_PARAM_TYPE_INT16
        self.loiter_radius = 80.0  # Default loiter radius
        if (
            self.drone.aircraft_type == 1
        ):  # Copter doesn't have loiter radius, only Plane
            self.getLoiterRadiusFromDrone()

    @sendingCommandLock
    def getHomePosition(self) -> Response:
        """
        Request the current home position from the drone.
        """
        if not self.drone.reserve_message_type("HOME_POSITION", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve HOME_POSITION messages",
            }

        try:
            self.drone.sendCommand(
                mavutil.mavlink.MAV_CMD_REQUEST_MESSAGE,
                param1=mavutil.mavlink.MAVLINK_MSG_ID_HOME_POSITION,
            )

            response = self.drone.wait_for_message(
                "HOME_POSITION", self.controller_id, timeout=1.5
            )

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
                self.drone.logger.warning("Could not get home position")
                return {
                    "success": False,
                    "message": "Could not get home position",
                }

        except serial.serialutil.SerialException:
            self.drone.logger.warning("Could not get home position, serial exception")
            return {
                "success": False,
                "message": "Could not get home position, serial exception",
            }
        finally:
            self.drone.release_message_type("HOME_POSITION", self.controller_id)

    @sendingCommandLock
    def setHomePosition(self, lat: float, lon: float, alt: float) -> Response:
        """
        Set the home point of the drone.

        Args:
            lat (float): The latitude of the home point
            lon (float): The longitude of the home point
            alt (float): The altitude of the home point
        """
        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            self.drone.sendCommandInt(
                mavutil.mavlink.MAV_CMD_DO_SET_HOME, x=lat, y=lon, z=alt
            )

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                timeout=2,
            )

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
            return {
                "success": False,
                "message": "Could not set home point, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

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

        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        self.drone.sending_command_lock.acquire()

        try:
            self.drone.sendCommand(mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, param7=alt)

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                timeout=3,
            )

            self.drone.sending_command_lock.release()

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_NAV_TAKEOFF):
                self.drone.logger.info("Takeoff command send successfully")
                return {"success": True, "message": "Takeoff command sent successfully"}
            else:
                return {
                    "success": False,
                    "message": "Could not takeoff",
                }

        except serial.serialutil.SerialException:
            self.drone.sending_command_lock.release()
            return {
                "success": False,
                "message": "Could not takeoff, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

    @sendingCommandLock
    def land(self) -> Response:
        """
        Tells the drone to land.

        Returns:
            Response: The response from the land command
        """
        if not self.drone.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            self.drone.sendCommand(mavutil.mavlink.MAV_CMD_NAV_LAND)

            response = self.drone.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                timeout=3,
            )

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_NAV_LAND):
                self.drone.logger.info("Land command send successfully")
                return {"success": True, "message": "Land command sent successfully"}
            else:
                return {
                    "success": False,
                    "message": "Could not land",
                }

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": "Could not land, serial exception",
            }
        finally:
            self.drone.release_message_type("COMMAND_ACK", self.controller_id)

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
        guidedModeSetResult = self.drone.flightModesController.setGuidedMode()
        if not guidedModeSetResult["success"]:
            return guidedModeSetResult

        try:
            with self.drone.sending_command_lock:
                self.drone.master.mav.set_position_target_global_int_send(
                    0,
                    self.drone.target_system,
                    self.drone.target_component,
                    mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
                    65016,  # Bitmask to ignore all values except for x, y and z
                    int(lat * 1e7),
                    int(lon * 1e7),
                    alt,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                )

            self.drone.logger.info(f"Reposition command sent to {lat}, {lon}, {alt}m")

            return {
                "success": True,
                "message": "Reposition command sent successfully",
                "data": {
                    "lat": lat,
                    "lon": lon,
                    "alt": alt,
                },
            }
        except serial.serialutil.SerialException:
            self.drone.logger.error("Reposition command not accepted, serial exception")
            return {
                "success": False,
                "message": "Could not reposition, serial exception",
            }

    def getLoiterRadiusFromDrone(self) -> Response:
        """
        Get the loiter radius of the drone.
        """
        self.drone.logger.debug("Fetching loiter radius")
        loiter_radius_data = self.drone.paramsController.getSingleParam(
            "WP_LOITER_RAD", timeout=1.5
        )

        if loiter_radius_data.get("success"):
            loiter_radius_param = loiter_radius_data.get("data")
            if loiter_radius_param is not None:
                self.loiter_radius = loiter_radius_param.param_value
                return {
                    "success": True,
                    "data": self.loiter_radius,
                }
            else:
                self.drone.logger.error(
                    "Loiter radius parameter found, but parameter value not found"
                )
                return {
                    "success": False,
                    "message": "Loiter radius parameter found, but parameter value not found",
                }
        else:
            self.drone.logger.error(loiter_radius_data.get("message"))
            return {
                "success": False,
                "message": loiter_radius_data.get("message", ""),
            }

    def getLoiterRadius(self) -> Response:
        """
        Get the loiter radius of the drone from the cached parameters.

        Returns:
            Response: The response from the get loiter radius command
        """

        loiter_radius_data = self.drone.paramsController.getCachedParam("WP_LOITER_RAD")

        if loiter_radius_data.get("param_value") is None:
            self.drone.logger.warning(
                "Loiter radius parameter not found in cache, fetching from drone"
            )
            return self.getLoiterRadiusFromDrone()

        self.loiter_radius = loiter_radius_data.get("param_value", self.loiter_radius)

        return {
            "success": True,
            "data": self.loiter_radius,
        }

    def setLoiterRadius(self, radius: float) -> Response:
        """
        Set the loiter radius of the drone.

        Args:
            radius (float): The loiter radius in meters
        """

        param_set_success = self.drone.paramsController.setParam(
            "WP_LOITER_RAD", radius, self.loiter_radius_param_type
        )

        if param_set_success:
            self.drone.logger.info(f"Loiter radius set to {radius}m")
            self.loiter_radius = radius

            return {
                "success": True,
                "message": f"Loiter radius set to {radius}m",
            }
        else:
            return {
                "success": False,
                "message": f"Failed to set loiter radius set to {radius}m",
            }
