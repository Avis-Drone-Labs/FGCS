from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.drone import Drone


class RcController:
    def __init__(self, drone: Drone) -> None:
        """
        The RC controller handles all RC based actions.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone
        self.params = {}

        pitch_map = self.drone.paramsController.getSingleParam("RCMAP_PITCH").get(
            "data"
        )
        roll_map = self.drone.paramsController.getSingleParam("RCMAP_ROLL").get("data")
        throttle_map = self.drone.paramsController.getSingleParam("RCMAP_THROTTLE").get(
            "data"
        )
        yaw_map = self.drone.paramsController.getSingleParam("RCMAP_YAW").get("data")

        if pitch_map:
            self.params["pitch"] = pitch_map.param_value
        if roll_map:
            self.params["roll"] = roll_map.param_value
        if throttle_map:
            self.params["throttle"] = throttle_map.param_value
        if yaw_map:
            self.params["yaw"] = yaw_map.param_value

        for channel_number in range(1, 17):
            channel_params = {}

            min_param = self.drone.paramsController.getSingleParam(
                f"RC{channel_number}_MIN"
            ).get("data")
            max_param = self.drone.paramsController.getSingleParam(
                f"RC{channel_number}_MAX"
            ).get("data")
            reversed_param = self.drone.paramsController.getSingleParam(
                f"RC{channel_number}_REVERSED"
            ).get("data")
            option_param = self.drone.paramsController.getSingleParam(
                f"RC{channel_number}_OPTION"
            ).get("data")

            if min_param:
                channel_params["min"] = min_param.param_value
            if max_param:
                channel_params["max"] = max_param.param_value
            if reversed_param:
                channel_params["reversed"] = reversed_param.param_value
            if option_param:
                channel_params["option"] = option_param.param_value

            self.params[f"RC_{channel_number}"] = channel_params
