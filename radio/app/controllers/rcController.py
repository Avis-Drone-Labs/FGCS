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
        self.params: dict = {}

        self.getAndSetParam(self.params, "pitch", "RCMAP_PITCH")
        self.getAndSetParam(self.params, "roll", "RCMAP_ROLL")
        self.getAndSetParam(self.params, "throttle", "RCMAP_THROTTLE")
        self.getAndSetParam(self.params, "yaw", "RCMAP_YAW")

        for channel_number in range(1, 17):
            channel_params: dict = {}

            self.getAndSetParam(channel_params, "min", f"RC{channel_number}_MIN")
            self.getAndSetParam(channel_params, "max", f"RC{channel_number}_MAX")
            self.getAndSetParam(
                channel_params, "reversed", f"RC{channel_number}_REVERSED"
            )
            self.getAndSetParam(channel_params, "option", f"RC{channel_number}_OPTION")

            self.params[f"RC_{channel_number}"] = channel_params

    def getAndSetParam(self, params_dict: dict, param_key: str, param_name: str):
        """
        Gets and set the value of a parameter inside a dictionary.

        Args:
            params_dict (dict): The dictionary to store the parameters
            param_key (str): The key for the parameter within the dictionary
            param_name (str): The name of the parameter
        """
        param = self.drone.paramsController.getSingleParam(param_name).get("data")
        if param:
            params_dict[param_key] = param.param_value
