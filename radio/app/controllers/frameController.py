from __future__ import annotations

from typing import TYPE_CHECKING, Union

from app.customTypes import Number, VehicleType

if TYPE_CHECKING:
    from app.drone import Drone


class FrameController:
    def __init__(self, drone: Drone) -> None:
        """The frame class controls all frame class and type related actions

        Args:
            drone (Drone) : The main drone object
        """
        self.drone = drone

        self.frame_type: Union[Number, str] = "UNKNOWN"
        self.frame_class: Number = 0

        # Plane type doesn't have a frame type or class
        if self.drone.aircraft_type != VehicleType.FIXED_WING.value:
            self.getFrameType()
            self.getFrameClass()

    def getFrameType(self) -> None:
        """
        Gets the current frame type of the drone."""
        self.drone.logger.debug("Fetching frame type")
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
        self.drone.logger.debug("Fetching frame class")
        frame_class_result = self.drone.paramsController.getSingleParam("FRAME_CLASS")

        if frame_class_result.get("success"):
            frame_class_data = frame_class_result.get("data")
            if frame_class_data:
                self.frame_class = frame_class_data.param_value
        else:
            self.drone.logger.error(frame_class_result.get("message"))

    def getConfig(self) -> dict:
        """
        Get the current frame config from cached parameters.

        Returns:
            dict: The frame config of the drone
        """
        self.frame_type = self.drone.paramsController.getCachedParam("FRAME_TYPE").get(
            "param_value", "UNKNOWN"
        )
        self.frame_class = self.drone.paramsController.getCachedParam(
            "FRAME_CLASS"
        ).get("param_value", 0)

        return {
            "frame_type": self.frame_type,
            "frame_class": self.frame_class,
        }
