from __future__ import annotations

import time
import logging
from typing import TYPE_CHECKING

from app.customTypes import Response
from app.utils import commandAccepted
from pymavlink import mavutil

if TYPE_CHECKING:
    from app.drone import Drone

logger = logging.getLogger("fgcs")

class ArmController:
    
    
    def __init__(self, drone: Drone) -> None:
        """
        The Arm controller controls all arm/disarming operations.

        Args:
            drone (Drone): The main drone object
        """
        self.drone = drone

    def arm(self, force: bool = False) -> Response:
        """
        Arm the drone.

        Args:
            force (bool, optional): Option to force arm the drone. Defaults to False.

        Returns:
            Response: The response from the arm command
        """
        if self.drone.armed:
            logger.warning("Arm failed: Drone already armed")
            return {"success": False, "message": "Already armed"}

        self.drone.is_listening = False

        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            param1=1,  # 0=disarm, 1=arm
            param2=2989 if force else 0,  # force arm/disarm
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM):
                # Wait for the drone to be armed fully after the command has been accepted
                self.drone.logger.debug("Waiting for arm")
                while not self.drone.armed:
                    time.sleep(0.05)
                logger.debug("Armed successfully")
                return {"success": True, "message": "Armed successfully"}
            else:
                logger.warning("Arm failed: command not accepted")
        except Exception as e:
            self.drone.is_listening = True
            logger.error(e, exc_info=True)
            if self.drone.droneErrorCb:
                self.drone.droneErrorCb(str(e))
            return {"success": False, "message": "Could not arm, serial exception"}
        
        logger.warning("Arm failed: unknown error")
        return {"success": False, "message": "Could not arm, command not accepted"}

    def disarm(self, force: bool = False) -> Response:
        """
        Disarm the drone.

        Args:
            force (bool, optional): Option to force disarm the drone. Defaults to False.

        Returns:
            Response: The response from the disarm command
        """
        if not self.drone.armed:
            logger.warning("Disarm failed: Drone is already disarmed")
            return {"success": False, "message": "Already disarmed"}

        self.drone.is_listening = False

        self.drone.sendCommand(
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            param1=0,  # 0=disarm, 1=arm
            param2=2989 if force else 0,  # force arm/disarm
        )

        try:
            response = self.drone.master.recv_match(type="COMMAND_ACK", blocking=True)
            self.drone.is_listening = True

            if commandAccepted(response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM):
                # Wait for the drone to be disarmed fully after the command has been accepted
                self.drone.logger.debug("Waiting for disarm")
                while self.drone.armed:
                    time.sleep(0.05)
                logger.debug("Disarmed successfully")
                return {"success": True, "message": "Disarmed successfully"}
            else:
                logger.warning("Disarm failed: command not accepted")
        except Exception as e:
            self.drone.is_listening = True
            logger.error(e, exc_info=True)
            
            if self.drone.droneErrorCb:
                self.drone.droneErrorCb(str(e))
                
            return {"success": False, "message": "Could not disarm, serial exception"}

        logger.warning("Disarm failed: unknown error")
        return {"success": False, "message": "Could not disarm, command not accepted"}
