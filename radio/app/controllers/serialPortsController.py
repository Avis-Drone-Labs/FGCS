from __future__ import annotations

from typing import TYPE_CHECKING

from app.customTypes import Number, Response, SetConfigParam

if TYPE_CHECKING:
    from app.drone import Drone


class SerialPortsController:
    def __init__(self, drone: Drone) -> None:
        """
        The Serial Ports controller handles all serial port config related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone
        self.params: dict = {}
        self.param_types: dict = {}

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
            self.param_types[param_name] = param.param_type

    def _getAndSetCachedParam(
        self, params_dict: dict, param_key: str, param_name: str
    ) -> None:
        """
        Gets and set the value of a cached parameter inside a dictionary.
        Silently skips if param doesn't exist in cache (some params may not exist on all firmware).

        Args:
            params_dict (dict): The dictionary to store the parameters
            param_key (str): The key for the parameter within the dictionary
            param_name (str): The name of the parameter
        """
        cached_param = self.drone.paramsController.getCachedParam(param_name)
        if cached_param:
            params_dict[param_key] = cached_param.get("param_value")
            # Store param_type for setConfigParam
            param_type = cached_param.get("param_type")
            if param_type is not None:
                self.param_types[param_name] = param_type
        # Don't try to fetch from drone - param may not exist on this firmware

    def fetchParams(self) -> None:
        """
        Fetches the serial port parameters from the drone.
        Only fetches SERIAL1-7.
        """
        self.drone.logger.debug("Fetching serial port parameters")

        # Fetch SERIAL1-7 parameters
        for port_number in range(1, 8):
            port_params = self.params.get(f"SERIAL_{port_number}", {})

            self._getAndSetParam(
                port_params, "protocol", f"SERIAL{port_number}_PROTOCOL"
            )
            self._getAndSetParam(port_params, "baud", f"SERIAL{port_number}_BAUD")
            # OPTIONS param may not exist on all firmware versions
            self._getAndSetParam(port_params, "options", f"SERIAL{port_number}_OPTIONS")

            self.params[f"SERIAL_{port_number}"] = port_params

    def getConfig(self) -> dict:
        """
        Returns the serial port configuration with the cached parameters.

        Returns:
            dict: The serial port configuration
        """
        # Get SERIAL1-7 parameters from cache
        for port_number in range(1, 8):
            port_params = self.params.get(f"SERIAL_{port_number}", {})

            self._getAndSetCachedParam(
                port_params, "protocol", f"SERIAL{port_number}_PROTOCOL"
            )
            self._getAndSetCachedParam(port_params, "baud", f"SERIAL{port_number}_BAUD")
            self._getAndSetCachedParam(
                port_params, "options", f"SERIAL{port_number}_OPTIONS"
            )

            self.params[f"SERIAL_{port_number}"] = port_params

        return self.params

    def setConfigParam(self, param_id: str, value: Number) -> bool:
        """
        Sets a serial port configuration related parameter on the drone.
        """
        param_type = self.param_types.get(param_id)

        return self.drone.paramsController.setParam(param_id, value, param_type)

    def batchSetConfigParams(self, params: list[SetConfigParam]) -> Response:
        """
        Sets multiple serial port configuration related parameters on the drone.
        """
        param_set_failures = []
        param_set_successes = []
        for item in params:
            param_id = item.get("param_id")
            value = item.get("value")
            if param_id and value is not None:
                if not self.setConfigParam(param_id, value):
                    param_set_failures.append(param_id)
                else:
                    param_set_successes.append({"param_id": param_id, "value": value})

        if len(param_set_failures) == 0:
            return {
                "success": True,
                "message": f"Set {len(param_set_successes)} parameters successfully.",
                "data": param_set_successes,
            }

        # Even though the batch operation may fail, some params may get set
        # successfully
        return {
            "success": False,
            "message": f"Failed to set {len(param_set_failures)} parameters: {param_set_failures}",
            "data": param_set_successes,
        }
