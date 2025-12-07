from __future__ import annotations

import struct
from threading import current_thread
from typing import TYPE_CHECKING, List, Optional

from app.customTypes import Number, Response
from pymavlink import mavftp, mavftp_op

if TYPE_CHECKING:
    from app.drone import Drone


class FtpController:
    def __init__(self, drone: Drone) -> None:
        """
        The FTP controller controls all MAVFtp-related actions.

        Args:
            drone (Drone): The main drone object
        """
        self.controller_id: str = f"ftp_{current_thread().ident}"
        self.drone: Drone = drone
        self.seq: int = 0
        self.session: int = 0
        self.last_op: Optional[mavftp_op.FTP_OP] = None
        self.dir_offset: int = 0
        self.list_result: List[mavftp.DirectoryEntry] = []
        self.list_temp_result: List[mavftp.DirectoryEntry] = []

        self._sendFtpCommand(
            mavftp_op.FTP_OP(
                self.seq,
                self.session,
                mavftp_op.OP_ResetSessions,
                0,
                0,
                0,
                0,
                None,
            )
        )
        self._processFtpResponse("reset_sessions")

    def _sendFtpCommand(self, op: mavftp_op.FTP_OP) -> None:
        """
        Send a MAVFTP command and wait for a response.

        Args:
            op (mavftp_op.FTP_OP): The FTP operation to send.

        """
        payload = op.pack()
        payload_length = len(payload)
        if payload_length < mavftp.MAX_Payload + mavftp.HDR_Len:
            payload.extend(
                bytearray(
                    [0] * ((mavftp.HDR_Len + mavftp.MAX_Payload) - payload_length)
                )
            )

        self.drone.sending_command_lock.acquire()

        self.drone.master.mav.file_transfer_protocol_send(
            0,  # network (0 for broadcast)
            self.drone.target_system,
            self.drone.target_component,
            payload,
        )

        self.drone.sending_command_lock.release()

        self.seq = (self.seq + 1) % 256
        self.last_op = op

    def _processFtpResponse(self, op_name: str, timeout: Number = 5) -> Response:
        """
        Handle the response for a given FTP operation.
        Listens for FILE_TRANSFER_PROTOCOL messages for the specified timeout duration.

        Args:
            op_name (str): The name of the operation to handle.
            timeout (Number): How long to listen for responses (in seconds).

        Returns:
            Response: A response object indicating success or failure.
        """
        import time

        if not self.drone.reserve_message_type(
            "FILE_TRANSFER_PROTOCOL", self.controller_id
        ):
            self.drone.logger.error(
                f"{self.controller_id}: Could not reserve FILE_TRANSFER_PROTOCOL message type"
            )
            return {
                "success": False,
                "message": "Could not reserve FILE_TRANSFER_PROTOCOL messages",
            }

        try:
            start_time = time.time()

            # Continue listening until timeout expires
            while time.time() - start_time < timeout:
                remaining_time = timeout - (time.time() - start_time)

                # Wait for message with remaining timeout
                response = self.drone.wait_for_message(
                    "FILE_TRANSFER_PROTOCOL",
                    self.controller_id,
                    timeout=min(remaining_time, 1.0),  # Check at least every second
                )

                if response is None:
                    continue

                response_op = self._parseFtpResponse(response)

                # Check session validity
                if response_op.session != self.session:
                    self.drone.logger.warning(
                        f"Received response for wrong session: {response_op.session} (expected {self.session})"
                    )
                    continue

                # Handle terminate session
                if op_name == "terminate_session":
                    self.drone.logger.info("Session terminated successfully")
                    return {
                        "success": True,
                        "message": "Session terminated successfully",
                    }

                # Handle list directory responses
                if response_op.req_opcode == mavftp_op.OP_ResetSessions:
                    return self._handleResetSessionsResponse(response_op)
                elif response_op.req_opcode == mavftp_op.OP_ListDirectory:
                    handling_finished = self._handleListFilesResponse(response_op)

                    if handling_finished:
                        return {
                            "success": True,
                            "message": "Directory listing retrieved successfully",
                        }
                else:
                    self.drone.logger.info(
                        f"Received unknown FTP response: {response_op.opcode} with {response_op.size} bytes for operation {op_name}"
                    )

            # Log timeout if we didn't receive expected completion
            if time.time() - start_time >= timeout:
                self.drone.logger.warning(
                    f"Timeout ({timeout}s) reached while waiting for FTP responses for operation {op_name}"
                )
                return {
                    "success": False,
                    "message": f"Timeout reached while waiting for FTP responses for operation {op_name}",
                }
            else:
                return {
                    "success": True,
                    "message": f"FTP operation {op_name} completed successfully",
                }
        except Exception as e:
            self.drone.logger.error(
                f"Error handling FTP response for operation {op_name}: {e}"
            )
            return {
                "success": False,
                "message": f"Error handling FTP response for operation {op_name}: {e}",
            }
        finally:
            # Always release the message type
            self.drone.release_message_type(
                "FILE_TRANSFER_PROTOCOL", self.controller_id
            )

    def _parseFtpResponse(
        self, message: mavftp.FILE_TRANSFER_PROTOCOL
    ) -> mavftp_op.FTP_OP:
        """
        Parse a FILE_TRANSFER_PROTOCOL message into an FTP_OP object.

        Args:
            message (mavftp.FILE_TRANSFER_PROTOCOL): The MAVLink message to parse.

        Returns:
            mavftp_op.FTP_OP: The parsed FTP operation.
        """
        header = bytearray(message.payload[: mavftp.HDR_Len])
        (
            seq,
            session,
            opcode,
            size,
            req_opcode,
            burst_complete,
            _padding,
            offset,
        ) = struct.unpack("<HBBBBBBI", header)
        payload = bytearray(message.payload[mavftp.HDR_Len :])[:size]

        return mavftp_op.FTP_OP(
            seq,
            session,
            opcode,
            size,
            req_opcode,
            burst_complete,
            offset,
            payload,
        )

    def _handleResetSessionsResponse(self, response_op: mavftp_op.FTP_OP) -> Response:
        """
        Handle the response for a reset sessions operation.

        Args:
            response_op (mavftp_op.FTP_OP): The FTP operation response to handle.

        Returns:
            Response: A response object indicating success or failure.
        """
        if response_op is None:
            self.drone.logger.error("No response op for reset sessions operation")
            return {
                "success": False,
                "message": "Failed to reset sessions",
            }

        if response_op.opcode == mavftp_op.OP_Ack:
            self.drone.logger.info("Sessions reset successfully")
            return {
                "success": True,
                "message": "Sessions reset successfully",
            }
        else:
            self.drone.logger.error("Failed to reset sessions")
            return {
                "success": False,
                "message": "Failed to reset sessions",
            }

    def _handleListFilesResponse(self, response_op: mavftp_op.FTP_OP) -> bool:
        """
        Handle the response for a list files operation.

        Args:
            response_op (mavftp_op.FTP_OP): The FTP operation response to handle.

        Returns:
            bool: True if the listing is complete, False otherwise.
        """
        if response_op is None:
            self.drone.logger.error("No response op for list files operation")
            return True

        output: List[mavftp.DirectoryEntry] = []

        if response_op.opcode == mavftp_op.OP_Ack and response_op.payload is not None:
            entries = sorted(response_op.payload.split(b"\x00"))
            for entry in entries:
                if len(entry) == 0:
                    continue
                self.dir_offset += 1

                try:
                    decoded_entry = str(entry, "ascii")
                except Exception as e:
                    self.drone.logger.warning(f"Error decoding directory entry: {e}")
                    continue

                if len(decoded_entry) == 0:
                    self.drone.logger.warning("Received empty directory entry")
                    continue

                if decoded_entry[0] == "D":
                    output.append(
                        mavftp.DirectoryEntry(
                            name=decoded_entry[1:], is_dir=True, size_b=0
                        )
                    )
                elif decoded_entry[0] == "F":
                    try:
                        (name, size_str) = decoded_entry[1:].split("\t")
                        size = int(size_str)
                        output.append(
                            mavftp.DirectoryEntry(name=name, is_dir=False, size_b=size)
                        )
                    except Exception as e:
                        self.drone.logger.warning(
                            f"Error parsing file entry '{decoded_entry}': {e}"
                        )
                        continue

            if self.last_op is None or self.last_op.payload is None:
                self.drone.logger.error("No last operation or payload for list files")
                return True

            encoded_path = self.last_op.payload
            more_list_files_op = mavftp_op.FTP_OP(
                self.seq,
                self.session,
                mavftp_op.OP_ListDirectory,
                len(encoded_path),
                0,
                0,
                self.dir_offset,
                encoded_path,
            )
            self._sendFtpCommand(more_list_files_op)
        elif (
            response_op.opcode == mavftp_op.OP_Nack
            and response_op.payload is not None
            and len(response_op.payload) == 1
            and response_op.payload[0] == mavftp.FtpError.EndOfFile.value
        ):
            self.list_result = self.list_temp_result
            return True

        self.list_temp_result.extend(output)

        return False

    def _convertDirectoryEntriesToDicts(
        self, entries: List[mavftp.DirectoryEntry], path: str = ""
    ) -> List[dict]:
        """
        Convert a list of DirectoryEntry objects to a list of dictionaries.

        Args:
            entries (List[mavftp.DirectoryEntry]): The list of directory entries.
            path (str): The directory path, used in conversion.

        Returns:
            List[dict]: The list of directory entries as dictionaries.
        """
        dict_list = []
        for entry in entries:
            if entry.name == ".":
                calculated_path = path
            elif entry.name == "..":
                if path in ["", "/"]:
                    calculated_path = path
                else:
                    calculated_path = "/".join(path.split("/")[:-1]) or "/"
            else:
                if path == "":
                    calculated_path = entry.name
                elif path == "/":
                    calculated_path = f"/{entry.name}"
                else:
                    calculated_path = f"{path}/{entry.name}"

            dict_list.append(
                {
                    "name": entry.name,
                    "path": calculated_path,
                    "is_dir": entry.is_dir,
                    "size_b": entry.size_b,
                }
            )

        return dict_list

    def listFiles(self, path: str) -> Response:
        """
        List files in a directory on the drone using MAVFTP.

        Args:
            path (str): The directory path to list files from.

        Returns:
            Response: A response object containing the status and data or error message.
        """
        if path == "":
            return {
                "success": False,
                "message": "Path cannot be empty",
            }

        encoded_path = bytearray(path, "ascii")
        directory_offset = 0
        op = mavftp_op.FTP_OP(
            self.seq,
            self.session,
            mavftp_op.OP_ListDirectory,
            len(encoded_path),
            0,
            0,
            directory_offset,
            encoded_path,
        )

        self.dir_offset = 0
        self.list_result = []
        self.list_temp_result = []

        self.drone.logger.info(f"Listing files in directory: {path}")

        self._sendFtpCommand(op)
        response = self._processFtpResponse("list_files")

        if response.get("success", False) is False:
            return response

        return {
            "success": True,
            "message": "Directory listing retrieved successfully",
            "data": self._convertDirectoryEntriesToDicts(self.list_result, path),
        }
