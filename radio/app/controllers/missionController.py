from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any, List

import serial
from app.customTypes import Response
from app.utils import commandAccepted, wpToMissionItemInt
from pymavlink import mavutil, mavwp

if TYPE_CHECKING:
    from app.drone import Drone

TYPE_MISSION = mavutil.mavlink.MAV_MISSION_TYPE_MISSION
TYPE_FENCE = mavutil.mavlink.MAV_MISSION_TYPE_FENCE
TYPE_RALLY = mavutil.mavlink.MAV_MISSION_TYPE_RALLY
MISSION_TYPES = [TYPE_MISSION, TYPE_FENCE, TYPE_RALLY]


class MissionController:
    def __init__(self, drone: Drone) -> None:
        """
        The mission class controls all mission-related actions.

        Args:
            drone (Drone): The main drone object
        """

        self.drone = drone

        self.missionLoader = mavwp.MAVWPLoader(
            target_system=drone.target_system, target_component=drone.target_component
        )
        self.fenceLoader = mavwp.MissionItemProtocol_Fence(
            target_system=drone.target_system, target_component=drone.target_component
        )
        self.rallyLoader = mavwp.MissionItemProtocol_Rally(
            target_system=drone.target_system, target_component=drone.target_component
        )

    def _checkMissionType(self, mission_type: int) -> Response:
        if mission_type not in MISSION_TYPES:
            return {
                "success": False,
                "message": f"Invalid mission type {mission_type}. Must be one of {MISSION_TYPES}",
            }
        return {"success": True}

    def getCurrentMission(self, mission_type: int) -> Response:
        """
        Get the current mission of a specific type from the drone.
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        failure_message = "Could not get current mission"

        try:
            mission_items = self.getMissionItems(mission_type=mission_type)
            if not mission_items.get("success"):
                return {
                    "success": False,
                    "message": mission_items.get("message", failure_message),
                }

            return {
                "success": True,
                "data": [item.to_dict() for item in mission_items.get("data", [])],
            }
        except serial.serialutil.SerialException:
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def getCurrentMissionAll(self) -> Response:
        """
        Get the current mission, fence and rally from the drone.
        """
        mission_items: List[Any] = []
        fence_items: List[Any] = []
        rally_items: List[Any] = []

        _mission_items = self.getMissionItems(mission_type=TYPE_MISSION)
        if not _mission_items.get("success"):
            self.drone.logger.warning(_mission_items.get("message"))
        else:
            mission_items = _mission_items.get("data", [])

        _fence_items = self.getMissionItems(mission_type=TYPE_FENCE)
        if not _fence_items.get("success"):
            self.drone.logger.warning(_fence_items.get("message"))
        else:
            fence_items = _fence_items.get("data", [])

        _rally_items = self.getMissionItems(mission_type=TYPE_RALLY)
        if not _rally_items.get("success"):
            self.drone.logger.warning(_rally_items.get("message"))
        else:
            rally_items = _rally_items.get("data", [])

        return {
            "success": True,
            "data": {
                "mission_items": [item.to_dict() for item in mission_items],
                "fence_items": [item.to_dict() for item in fence_items],
                "rally_items": [item.to_dict() for item in rally_items],
            },
        }

    def getMissionItems(self, mission_type: int) -> Response:
        """
        Get all mission items of a specific type from the drone.

        Args:
            mission_type (int): The type of mission to get. 0=Mission,1=Fence,2=Rally.
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        failure_message = "Could not get current mission items"

        if mission_type == TYPE_MISSION:
            loader = self.missionLoader
        elif mission_type == TYPE_FENCE:
            loader = self.fenceLoader
        else:
            loader = self.rallyLoader

        self.drone.is_listening = False

        try:
            self.drone.master.mav.mission_request_list_send(
                self.drone.target_system,
                mavutil.mavlink.MAV_COMP_ID_AUTOPILOT1,
                mission_type=mission_type,
            )
        except TypeError:
            self.drone.is_listening = True
            # TypeError is raised if mavlink V1 is used where the mission_request_list_send
            # function does not have a mission_type parameter
            self.drone.logger.error(
                "Failed to request mission list from autopilot, got type error"
            )
            return {
                "success": False,
                "message": "Failed to request mission list from autopilot, got type error",
            }

        try:
            response = self.drone.master.recv_match(
                type=[
                    "MISSION_COUNT",
                ],
                blocking=True,
                timeout=2,
            )
            if response:
                if response.mission_type != mission_type:
                    self.drone.logger.error(
                        f"Received response with wrong mission type {response.mission_type}, expected {mission_type}"
                    )
                    return {
                        "success": False,
                        "message": f"Received response with wrong mission type {response.mission_type}, expected {mission_type}",
                    }
                self.drone.logger.debug(
                    f"Got response for mission count of {response.count} for mission type {response.mission_type}"
                )
                loader.clear()
                self.drone.is_listening = True
                for i in range(0, response.count):
                    retry_count = 0
                    while retry_count < 3:
                        item_response = self.getItemDetails(
                            i, mission_type, response.count
                        )
                        if not item_response.get("success"):
                            retry_count += 1
                            self.drone.logger.warning(
                                f"Failed to get item details for mission item {i} for mission type {mission_type}, retry count {retry_count}/3"
                            )
                            continue

                        item_response_data = item_response.get("data", None)

                        if item_response_data:
                            loader.add(item_response_data)
                            break
                        else:
                            self.drone.logger.warning(
                                f"Failed to get item details for mission item {i} for mission type {mission_type}"
                            )
                            continue
                    else:
                        return {
                            "success": False,
                            "message": item_response.get("message", failure_message),
                        }
                return {
                    "success": True,
                    "data": loader.wpoints,
                }
            else:
                self.drone.is_listening = True
                self.drone.logger.error(
                    f"No response received for mission count for mission type {mission_type}."
                )
                return {
                    "success": False,
                    "message": failure_message,
                }

        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def getItemDetails(
        self, item_number: int, mission_type: int, mission_count: int
    ) -> Response:
        """
        Get the details of a specific mission item.

        Args:
            item_number (int): The number of the mission item to get
            mission_type (int): The type of mission to get. 0=Mission,1=Fence,2=Rally
            mission_count (int): The total count of mission items for the mission type, used just for logging

        Returns:
            Dict: The details of the mission item
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        failure_message = f"Failed to get mission item {item_number}/{mission_count} for mission type {mission_type}"

        self.drone.is_listening = False

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

            self.drone.is_listening = True

            if response:
                self.drone.logger.debug(
                    f"Got response for mission item {item_number}/{mission_count} for mission type {mission_type}"
                )
                return {
                    "success": True,
                    "data": response,
                }

            else:
                self.drone.logger.error(
                    f"Got no response for mission item {item_number}/{mission_count} for mission type {mission_type}"
                )
                return {
                    "success": False,
                    "message": failure_message,
                }

        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            self.drone.logger.error(
                f"Got no response for mission item {item_number}/{mission_count}, serial exception"
            )
            return {
                "success": False,
                "message": f"{failure_message}, serial exception",
            }

    def startMission(self) -> Response:
        """
        Start the mission on the drone.

        Returns:
            Dict: The response of the mission start request
        """
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
        """
        Restarts the mission on the drone.

        Returns:
            Dict: The response of the mission restart request
        """
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

    def clearMission(self, mission_type: int) -> Response:
        """
        Clears the specified mission type from the drone.

        Args:
            mission_type (int): The type of mission to clear. 0=Mission,1=Fence,2=Rally.
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        self.drone.is_listening = False
        self.drone.master.mav.mission_clear_all_send(
            self.drone.target_system,
            self.drone.target_component,
            mission_type=mission_type,
        )
        try:
            while True:
                response = self.drone.master.recv_match(
                    type=[
                        "MISSION_ACK",
                    ],
                    blocking=True,
                    timeout=2,
                )
                if not response:
                    break
                elif response.mission_type != mission_type:
                    continue
                elif response.type == 0:
                    self.drone.is_listening = True

                    return {
                        "success": True,
                        "message": "Mission cleared successfully",
                    }
                else:
                    self.drone.logger.error(
                        f"Error clearing mission, mission ack response: {response.type}"
                    )
                    break

            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not clear mission",
            }

        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not clear mission, serial exception",
            }

    def loadWaypointFile(self, file_path: str, mission_type: int) -> Response:
        """
        Loads waypoints from a file into the specified mission type.

        Args:
            file_path (str): The path to the waypoint file
            mission_type (int): The type of mission to load the waypoints into. 0=Mission,1=Fence,2=Rally.
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        if not os.path.exists(file_path):
            self.drone.logger.error(f"Waypoint file not found at {file_path}")
            return {
                "success": False,
                "message": f"Waypoint file not found at {file_path}",
            }

        if mission_type == TYPE_MISSION:
            loader = self.missionLoader
        elif mission_type == TYPE_FENCE:
            loader = self.fenceLoader
        else:
            loader = self.rallyLoader

        loader.load(file_path)

        # Remove the first point if it's a command 16 as this is usually a home point or placeholder.
        if mission_type in [TYPE_FENCE, TYPE_RALLY]:
            first_wp = loader.item(0)
            if first_wp.command == 16:
                loader.remove(first_wp)

        self.drone.logger.info(
            f"Loaded waypoint file with {loader.count()} points successfully"
        )
        return {
            "success": True,
            "message": f"Waypoint file loaded {loader.count()} points successfully",
        }

    def uploadMission(self, mission_type: int) -> Response:
        """
        Uploads the current mission to the drone.

        Args:
            mission_type (int): The type of mission to upload. 0=Mission,1=Fence,2=Rally.
        """
        mission_type_check = self._checkMissionType(mission_type)
        if not mission_type_check.get("success"):
            return mission_type_check

        if mission_type == TYPE_MISSION:
            loader = self.missionLoader
        elif mission_type == TYPE_FENCE:
            loader = self.fenceLoader
        else:
            loader = self.rallyLoader

        if loader.count() == 0:
            return {
                "success": False,
                "message": f"No waypoints loaded for the mission type of {mission_type}",
            }

        clear_mission_response = self.clearMission(mission_type)
        if not clear_mission_response.get("success"):
            return clear_mission_response

        self.drone.is_listening = False

        self.drone.master.mav.mission_count_send(
            self.drone.target_system,
            self.drone.target_component,
            loader.count(),
            mission_type=mission_type,
        )

        try:
            while True:
                response = self.drone.master.recv_match(
                    type=["MISSION_REQUEST", "MISSION_ACK"],
                    blocking=True,
                    timeout=2,
                )
                if not response:
                    self.drone.is_listening = True

                    return {
                        "success": False,
                        "message": "Could not upload mission, mission request not received",
                    }
                elif response.msgname == "MISSION_ACK" and response.type != 0:
                    self.drone.logger.error(
                        f"Error uploading mission, mission ack response: {response.type}"
                    )
                    return {
                        "success": False,
                        "message": "Could not upload mission, received mission acknowledgement error",
                    }
                elif response.mission_type == mission_type:
                    self.drone.logger.debug(
                        f"Sending mission item {response.seq} out of {loader.count()}"
                    )
                    self.drone.master.mav.send(
                        wpToMissionItemInt(loader.item(response.seq))
                    )

                    if response.seq == loader.count() - 1:
                        mission_ack_response = self.drone.master.recv_match(
                            type=[
                                "MISSION_ACK",
                            ],
                            blocking=True,
                            timeout=2,
                        )
                        self.drone.is_listening = True

                        if (
                            mission_ack_response
                            and mission_ack_response.type == 0
                            and mission_ack_response.mission_type == mission_type
                        ):
                            self.drone.logger.info("Uploaded mission successfully")
                            return {
                                "success": True,
                                "message": "Mission uploaded successfully",
                            }
                        else:
                            self.drone.logger.error(
                                f"Error uploading mission, mission ack response: {mission_ack_response.type}"
                            )
                            return {
                                "success": False,
                                "message": "Could not upload mission, not received mission acknowledgement",
                            }
        except serial.serialutil.SerialException:
            self.drone.is_listening = True
            return {
                "success": False,
                "message": "Could not upload mission, serial exception",
            }
