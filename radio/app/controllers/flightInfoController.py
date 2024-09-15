from __future__ import annotations

import time
from typing import TYPE_CHECKING

import serial
from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


class FlightInforController:
    def __init__(self, drone: Drone) -> None:
        """The frame class controls all frame class and type related actions

        Args:
            drone (Drone) : The main drone object
        """
        self.drone = drone

    def getFlightInfo(self) -> Response:
        self.drone.is_listening = False
        time.sleep(0.3)
        # self.drone.logger.info("Before sending request")
        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_REQUEST_MESSAGE,
            param1=264,
        )

        try:
            # self.drone.logger.info("Before Response")
            response = self.drone.master.recv_match(
                type="COMMAND_ACK", blocking=True, timeout=3
            )
            # logger.info(f"{response}")
            if commandAccepted(response, mavutil.mavlink.MAV_CMD_REQUEST_MESSAGE):
                self.drone.is_listening = True
                return {
                    "success": True,
                    "data": {
                        "arming_time": (
                            (response.arming_time_utc / 1000) + response.time_boot_ms
                        ),
                        "takeoff_time": (
                            (response.takeoff_time_utc / 1000) + response.time_boot_ms
                        ),
                        "booting_time": response.time_boot_utc,
                    },
                }
            else:
                self.drone.is_listening = True
                return {"success": False, "message": "Getting flight data failed"}
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Getting Flight data failed, serial exception",
            }
