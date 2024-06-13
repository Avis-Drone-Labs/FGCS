from __future__ import annotations

from typing import TYPE_CHECKING, Optional

import serial
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from radio.app.drone import Drone


class FrameController:
    def __init__(self, drone: Drone):
        """The frame class controls all frame class and type related actions

        Args:
            drone (Drone) : The main drone object
        """
        self.drone = drone
        self.getFrameType()
        self.getFrameClass()

    def getFrameType(self) -> None:
        """
        Gets the current frame type of the drone
        """
        self.frameType = "UNKNOWN"
        frameType = self.drone.paramsController.getSingleParam("FRAME_TYPE")

        if frameType.get("success"):
            self.frameType = frameType.get("data").param_value
        else:
            self.drone.logger.error(frameType.get("message"))

    def getFrameClass(self) -> None:
        """
        Gets the current frame class of the drone
        """
        self.frameClass = "UNKNOWN"
        frameClass = self.drone.paramsController.getSingleParam("FRAME_CLASS")

        if frameClass.get("success"):
            self.frameClass = frameClass.get("data").param_value
        else:
            self.drone.logger.error(frameClass.get("message"))
