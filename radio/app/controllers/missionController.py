from __future__ import annotations

from typing import TYPE_CHECKING, Any, List

import serial
from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone


class MissionController:
    def __init__(self, drone: Drone) -> None:
        """
        The mission class controls all mission-related actions.

        Args:
            drone (Drone): The main drone object
        """

        self.drone = drone

        self.mission_items: List[Any] = []
        self.fence_items: List[Any] = []
        self.rally_items: List[Any] = []

        mission_items = self.getMissionItems()
        if not mission_items.get("success"):
            self.drone.logger.warning(mission_items.get("message"))
            return
        else:
            self.mission_items = mission_items.get("data", [])

        fence_items = self.getMissionItems(mission_type=1)
        if not fence_items.get("success"):
            self.drone.logger.warning(fence_items.get("message"))
            return
        else:
            self.fence_items = fence_items.get("data", [])

        rally_items = self.getMissionItems(mission_type=2)
        if not rally_items.get("success"):
            self.drone.logger.warning(rally_items.get("message"))
            return
        else:
            self.rally_items = rally_items.get("data", [])

    def getMissionItems(self, mission_type: int = 0) -> Response:
        """
        Get all mission items of a specific type from the drone.

        Args:
            mission_type (int, optional): The type of mission to get. 0=Mission,1=Fence,2=Rally.
        """
        failure_message = "Could not get current mission items"

        items = []

        # TODO: Try send custom mission request list command?
        try:
            self.drone.master.mav.mission_request_list_send(
                self.drone.target_system,
                mavutil.mavlink.MAV_COMP_ID_AUTOPILOT1,
                mission_type=mission_type,
            )
        except TypeError:
            # TypeError is raised if mavlink V1 is used where the mission_request_list_send
            # function does not have a mission_type parameter
            return {
                "success": False,
                "message": failure_message,
            }

        try:
            response = self.drone.master.recv_match(
                type=[
                    "MISSION_COUNT",
                ],
                blocking=True,
                timeout=1.5,
            )
            if response:
                for i in range(0, response.count):
                    item_response = self.getItemDetails(i, mission_type=mission_type)
                    if not item_response.get("success"):
                        return {
                            "success": False,
                            "message": item_response.get("message", failure_message),
                        }

                    if (
                        self.drone.autopilot
                        == mavutil.mavlink.MAV_AUTOPILOT_ARDUPILOTMEGA
                        and i == 0
                        and mission_type == 0
                    ):
                        item_response_data = item_response.get("data")
                        if item_response_data and item_response_data.frame == 0:
                            continue

                    items.append(item_response.get("data"))

                return {
                    "success": True,
                    "data": items,
                }

            else:
                return {
                    "success": False,
                    "message": failure_message,
                }

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def getItemDetails(self, item_number: int, mission_type: int = 0) -> Response:
        """
        Get the details of a specific mission item.

        Args:
            item_number (int): The number of the mission item to get
            mission_type (int, optional): The type of mission to get. 0=Mission,1=Fence,2=Rally.

        Returns:
            Dict: The details of the mission item
        """
        failure_message = (
            f"Failed to get mission item {item_number} for mission type {mission_type}"
        )

        self.drone.master.mav.mission_request_int_send(
            self.drone.target_system,
            mavutil.mavlink.MAV_COMP_ID_AUTOPILOT1,
            item_number,
            mission_type=mission_type,
        )

        try:
            response = self.drone.master.recv_match(
                type="MISSION_ITEM_INT",
                blocking=True,
                timeout=1.5,
            )

            if response:
                return {
                    "success": True,
                    "data": response,
                }

            else:
                return {
                    "success": False,
                    "message": failure_message,
                }

        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def startMission(self) -> Response:
        self.drone.is_listening = False

        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_MISSION_START,
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)

            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_MISSION_START):
                return {
                    "success": True,
                    "message": "Starting mission",
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to start mission",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Failed to start mission, serial exception",
            }

    def restartMission(self) -> Response:
        self.drone.is_listening = False

        self.drone.sendCommand(mavutil.mavlink.MAV_CMD_DO_SET_MISSION_CURRENT, param2=1)

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)

            self.drone.is_listening = True

            if commandAccepted(
                response, mavutil.mavlink.MAV_CMD_DO_SET_MISSION_CURRENT
            ):
                return {
                    "success": True,
                    "message": "Restarting mission",
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to restart mission",
                }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Failed to restart mission, serial exception",
            }
