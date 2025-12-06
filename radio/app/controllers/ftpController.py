from __future__ import annotations

import struct
from enum import IntEnum
from threading import current_thread
from typing import TYPE_CHECKING, Optional

from app.customTypes import Number, Response
from pymavlink import mavftp

if TYPE_CHECKING:
    from app.drone import Drone


class FtpController:
    def __init__(self, drone: Drone) -> None:
        """
        The FTP controller controls all MAVFtp-related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.controller_id = f"ftp_{current_thread().ident}"
        self.drone = drone
