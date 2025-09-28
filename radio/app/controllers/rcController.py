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

        self.fetchParams()

    def _getAndSetParam(
        self, params_dict: dict, param_key: str, param_name: str
    ) -> None:
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

    def _getAndSetCachedParam(
        self, params_dict: dict, param_key: str, param_name: str
    ) -> None:
        """
        Gets and set the value of a cached parameter inside a dictionary.

        Args:
            params_dict (dict): The dictionary to store the parameters
            param_key (str): The key for the parameter within the dictionary
            param_name (str): The name of the parameter
        """
        param = self.drone.paramsController.getCachedParams(param_name)
        if param:
            params_dict[param_key] = param.get("param_value")
        else:
            self.drone.logger.warning(
                f"Param {param_name} not found in cache, fetching from drone"
            )
            param = self.drone.paramsController.getSingleParam(param_name).get("data")
            if param:
                params_dict[param_key] = param.param_value

    def fetchParams(self) -> None:
        """
        Fetches the RC parameters from the drone.
        """
        self.drone.logger.debug("Fetching RC parameters")
        self._getAndSetParam(self.params, "pitch", "RCMAP_PITCH")
        self._getAndSetParam(self.params, "roll", "RCMAP_ROLL")
        self._getAndSetParam(self.params, "throttle", "RCMAP_THROTTLE")
        self._getAndSetParam(self.params, "yaw", "RCMAP_YAW")

        for channel_number in range(1, 17):
            channel_params = self.params.get(f"RC_{channel_number}", {})

            self._getAndSetParam(channel_params, "min", f"RC{channel_number}_MIN")
            self._getAndSetParam(channel_params, "max", f"RC{channel_number}_MAX")
            self._getAndSetParam(
                channel_params, "reversed", f"RC{channel_number}_REVERSED"
            )
            self._getAndSetParam(channel_params, "option", f"RC{channel_number}_OPTION")

            self.params[f"RC_{channel_number}"] = channel_params

    def getConfig(self) -> dict:
        """
        Returns the RC configuration with the cached parameters.

        Returns:
            dict: The RC configuration
        """
        self._getAndSetCachedParam(self.params, "pitch", "RCMAP_PITCH")
        self._getAndSetCachedParam(self.params, "roll", "RCMAP_ROLL")
        self._getAndSetCachedParam(self.params, "throttle", "RCMAP_THROTTLE")
        self._getAndSetCachedParam(self.params, "yaw", "RCMAP_YAW")

        for channel_number in range(1, 17):
            channel_params = self.params.get(f"RC_{channel_number}", {})

            self._getAndSetCachedParam(channel_params, "min", f"RC{channel_number}_MIN")
            self._getAndSetCachedParam(channel_params, "max", f"RC{channel_number}_MAX")
            self._getAndSetCachedParam(
                channel_params, "reversed", f"RC{channel_number}_REVERSED"
            )
            self._getAndSetCachedParam(
                channel_params, "option", f"RC{channel_number}_OPTION"
            )

            self.params[f"RC_{channel_number}"] = channel_params

        return self.params
