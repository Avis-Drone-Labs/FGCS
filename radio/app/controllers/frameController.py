from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.drone import Drone


class FrameController:
    def __init__(self, drone: Drone) -> None:
        """The frame class controls all frame class and type related actions

        Args:
            drone (Drone) : The main drone object
        """
        self.drone = drone

        self.frame_type = "UNKNOWN"
        self.frame_class = 0

        # Plane type doesn't have a frame type or class
        if self.drone.aircraft_type != 1:
            self.getFrameType()
            self.getFrameClass()

    def getFrameType(self) -> None:
        """
        Gets the current frame type of the drone."""
        frame_type_result = self.drone.paramsController.getSingleParam("FRAME_TYPE")

        if frame_type_result.get("success"):
            frame_type_data = frame_type_result.get("data")
            if frame_type_data:
                self.frame_type = frame_type_data.param_value
        else:
            self.drone.logger.error(frame_type_result.get("message"))

    def getFrameClass(self) -> None:
        """
        Gets the current frame class of the drone."""
        frame_class_result = self.drone.paramsController.getSingleParam("FRAME_CLASS")

        if frame_class_result.get("success"):
            frame_class_data = frame_class_result.get("data")
            if frame_class_data:
                self.frame_class = frame_class_data.param_value
        else:
            self.drone.logger.error(frame_class_result.get("message"))
