from __future__ import annotations

import struct
import time
from io import BytesIO
from threading import current_thread
from typing import TYPE_CHECKING, List, Optional, Tuple

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
        self.current_op: Optional[str] = None

        # Directory listing state
        self.dir_offset: int = 0
        self.list_result: List[mavftp.DirectoryEntry] = []
        self.list_temp_result: List[mavftp.DirectoryEntry] = []

        # Read/download state
        self.read_buffer: BytesIO = BytesIO()
        self.read_total: int = 0
        self.read_gaps: List[Tuple[int, int]] = []  # List of (offset, size) tuples
        self.reached_eof: bool = False
        self.requested_size: int = 0
        self.requested_offset: int = 0
        self.remote_file_size: Optional[int] = None
        self.burst_size: int = 80  # Default burst size
        self.last_burst_read: Optional[float] = None

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
            last_response_time = start_time  # Track time of last response

            # Continue listening until timeout expires
            while time.time() - last_response_time < timeout:
                remaining_time = timeout - (time.time() - last_response_time)

                # Wait for message with remaining timeout
                response = self.drone.wait_for_message(
                    "FILE_TRANSFER_PROTOCOL",
                    self.controller_id,
                    timeout=min(remaining_time, 1.0),  # Check at least every second
                )

                if response is None:
                    continue

                # Reset timeout counters on every response
                last_response_time = time.time()

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

                if response_op.req_opcode == mavftp_op.OP_ResetSessions:
                    return self._handleResetSessionsResponse(response_op)
                elif response_op.req_opcode == mavftp_op.OP_ListDirectory:
                    # Handle list directory response
                    handling_finished = self._handleListFilesResponse(response_op)

                    if handling_finished:
                        return {
                            "success": True,
                            "message": "Directory listing retrieved successfully",
                        }
                elif response_op.req_opcode == mavftp_op.OP_OpenFileRO:
                    # Handle file open response
                    success = self._handleOpenFileReadOnlyResponse(response_op)
                    if not success:
                        return {
                            "success": False,
                            "message": "Failed to open file for reading",
                        }
                    # Continue listening for burst read responses
                elif response_op.req_opcode == mavftp_op.OP_BurstReadFile:
                    # Handle burst read response
                    is_complete = self._handleBurstReadResponse(response_op)
                    if is_complete:
                        return {
                            "success": True,
                            "message": "File read completed successfully",
                        }
                elif response_op.req_opcode == mavftp_op.OP_ReadFile:
                    # Handle gap fill response
                    is_complete = self._handleReadFileResponse(response_op)
                    if is_complete:
                        return {
                            "success": True,
                            "message": "File read completed successfully",
                        }
                else:
                    self.drone.logger.info(
                        f"Received unknown FTP response: {response_op.opcode} with {response_op.size} bytes for operation {op_name}"
                    )

            # Log timeout if we didn't receive expected completion
            if time.time() - last_response_time >= timeout:
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
        # Check if another operation is in progress
        if self.current_op is not None:
            return {
                "success": False,
                "message": f"FTP operation already in progress: {self.current_op}",
            }

        try:
            self.current_op = "list_files"

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

            if "logs" in path:
                timeout = 30
            else:
                timeout = 5

            response = self._processFtpResponse("list_files", timeout=timeout)

            if response.get("success", False) is False:
                return response

            self.drone.logger.info(
                f"Successfully listed {len(self.list_result)} files in directory: {path}"
            )

            return {
                "success": True,
                "message": "Directory listing retrieved successfully",
                "data": self._convertDirectoryEntriesToDicts(self.list_result, path),
            }
        finally:
            self.current_op = None

    def readFile(
        self,
        path: str,
        size: Optional[int] = None,
        offset: int = 0,
        progress_callback=None,
    ) -> Response:
        """
        Read/download a file from the drone using MAVFTP.

        Args:
            path (str): The file path to read.
            size (Optional[int]): Number of bytes to read. If None, reads entire file.
            offset (int): Offset in bytes to start reading from.
            progress_callback: Optional callback function called with (bytes_downloaded, total_bytes, percentage)

        Returns:
            Response: A response object containing the file data or error message.
        """
        # Check if another operation is in progress
        if self.current_op is not None:
            return {
                "success": False,
                "message": f"FTP operation already in progress: {self.current_op}",
            }

        self.progress_callback = progress_callback

        try:
            self.current_op = "read_file"

            if not path:
                return {
                    "success": False,
                    "message": "File path cannot be empty",
                }

            # Reset read state
            self.read_buffer = BytesIO()
            self.read_total = 0
            self.read_gaps = []
            self.reached_eof = False
            self.requested_offset = offset
            self.requested_size = (
                size if size is not None else 0
            )  # 0 means read entire file
            self.remote_file_size = None
            self.last_burst_read = None

            # Send OpenFileRO command
            encoded_path = bytearray(path, "ascii")
            op = mavftp_op.FTP_OP(
                self.seq,
                self.session,
                mavftp_op.OP_OpenFileRO,
                len(encoded_path),
                0,
                0,
                0,
                encoded_path,
            )

            self.drone.logger.info(
                f"Reading file: {path} (offset={offset}, size={size if size else 'entire file'})"
            )

            self._sendFtpCommand(op)
            response = self._processFtpResponse("read_file", timeout=30)

            if response.get("success", False) is False:
                return response

            # Extract the requested portion of the data
            self.read_buffer.seek(0)
            all_data = self.read_buffer.read()

            if self.requested_size > 0:
                # Return only the requested size from the requested offset
                result_data = all_data[
                    self.requested_offset : self.requested_offset + self.requested_size
                ]
            else:
                # Return entire file
                result_data = all_data

            self.drone.logger.info(
                f"Successfully read {len(result_data)} bytes from file: {path}"
            )

            return {
                "success": True,
                "message": "File read successfully",
                "data": {"file_data": result_data, "file_name": path.split("/")[-1]},
            }
        finally:
            self.current_op = None

    def _handleOpenFileReadOnlyResponse(self, response_op: mavftp_op.FTP_OP) -> bool:
        """
        Handle the response for an OpenFileRO operation.

        Args:
            response_op (mavftp_op.FTP_OP): The FTP operation response to handle.

        Returns:
            bool: True if the operation was successful and should continue reading.
        """
        if response_op.opcode == mavftp_op.OP_Ack:
            # Extract file size from payload if present
            if (
                response_op.size == 4
                and response_op.payload
                and len(response_op.payload) >= 4
            ):
                self.remote_file_size = (
                    response_op.payload[0]
                    | (response_op.payload[1] << 8)
                    | (response_op.payload[2] << 16)
                    | (response_op.payload[3] << 24)
                )

                self.drone.logger.info(
                    f"Remote file size: {self.remote_file_size} bytes"
                )

                # If no specific size was requested, read the entire file
                if self.requested_size == 0 and self.remote_file_size is not None:
                    self.requested_size = self.remote_file_size

            # Position the buffer at the requested offset
            self.read_buffer.seek(self.requested_offset)

            # Send first burst read request
            burst_read_op = mavftp_op.FTP_OP(
                self.seq,
                self.session,
                mavftp_op.OP_BurstReadFile,
                self.burst_size,
                0,
                0,
                self.requested_offset,
                None,
            )
            self.last_burst_read = time.time()
            self._sendFtpCommand(burst_read_op)
            return True
        else:
            # NACK or error
            if (
                response_op.opcode == mavftp_op.OP_Nack
                and response_op.payload is not None
                and len(response_op.payload) == 1
                and response_op.payload[0] == mavftp.FtpError.FileNotFound.value
            ):
                self.drone.logger.error(f"File not found: opcode={response_op.opcode}")
                return False

            self.drone.logger.error(
                f"Failed to open file for reading: opcode={response_op.opcode}"
            )
            return False

    def _handleBurstReadResponse(self, response_op: mavftp_op.FTP_OP) -> bool:
        """
        Handle the response for a BurstReadFile operation.

        Args:
            response_op (mavftp_op.FTP_OP): The FTP operation response to handle.

        Returns:
            bool: True if reading is complete, False if more data is expected.
        """
        if response_op.opcode == mavftp_op.OP_Ack and response_op.payload:
            self.last_burst_read = time.time()
            current_pos = self.read_buffer.tell()

            if response_op.offset < current_pos:
                # Writing an earlier portion - check if it fills a gap
                gap = (response_op.offset, len(response_op.payload))
                if gap in self.read_gaps:
                    self.read_gaps.remove(gap)
                    self.drone.logger.debug(
                        f"Filled gap at offset {gap[0]}, size {gap[1]}"
                    )
                else:
                    self.drone.logger.debug(
                        f"Duplicate data at offset {response_op.offset}"
                    )
                    return False

                # Write the payload and return to current position
                self.read_buffer.seek(response_op.offset)
                self.read_buffer.write(response_op.payload)
                self.read_total += len(response_op.payload)
                self.read_buffer.seek(current_pos)

            elif response_op.offset > current_pos:
                # We have a gap
                gap_size = response_op.offset - current_pos

                # Split large gaps into smaller chunks
                max_chunk = self.burst_size
                remaining_offset = current_pos
                remaining_size = gap_size

                while remaining_size > 0:
                    chunk_size = min(remaining_size, max_chunk)
                    self.read_gaps.append((remaining_offset, chunk_size))
                    remaining_offset += chunk_size
                    remaining_size -= chunk_size

                self.drone.logger.debug(
                    f"Gap detected: {gap_size} bytes at offset {current_pos}"
                )

                # Write the payload
                self.read_buffer.seek(response_op.offset)
                self.read_buffer.write(response_op.payload)
                self.read_total += len(response_op.payload)

            else:
                # Sequential write
                self.read_buffer.write(response_op.payload)
                self.read_total += len(response_op.payload)

            # Emit progress update
            if (
                hasattr(self, "progress_callback")
                and self.progress_callback
                and self.remote_file_size
            ):
                percentage = (self.read_total / self.remote_file_size) * 100
                self.progress_callback(
                    self.read_total, self.remote_file_size, percentage
                )

            # Check if burst is complete
            if response_op.burst_complete:
                if 0 < response_op.size < self.burst_size:
                    # EOF reached
                    self.reached_eof = True
                    self.drone.logger.debug(
                        f"EOF reached at {self.read_buffer.tell()} bytes with {len(self.read_gaps)} gaps"
                    )

                    if len(self.read_gaps) == 0:
                        # All data received
                        return True

                    # Request missing gaps
                    self._requestGaps()
                    return False
                else:
                    # Continue reading
                    next_offset = response_op.offset + response_op.size
                    burst_read_op = mavftp_op.FTP_OP(
                        self.seq,
                        self.session,
                        mavftp_op.OP_BurstReadFile,
                        self.burst_size,
                        0,
                        0,
                        next_offset,
                        None,
                    )
                    self._sendFtpCommand(burst_read_op)
                    return False

        elif response_op.opcode == mavftp_op.OP_Nack:
            # Check error code
            if response_op.payload and len(response_op.payload) > 0:
                error_code = response_op.payload[0]
                if error_code == mavftp.FtpError.EndOfFile.value:
                    self.reached_eof = True
                    self.drone.logger.debug(
                        f"EOF (NACK) at {self.read_buffer.tell()} bytes with {len(self.read_gaps)} gaps"
                    )

                    if len(self.read_gaps) == 0:
                        return True

                    # Request missing gaps
                    self._requestGaps()
                    return False
                else:
                    self.drone.logger.error(f"Read error: error code {error_code}")
                    return True  # Stop reading

        return False

    def _handleReadFileResponse(self, response_op: mavftp_op.FTP_OP) -> bool:
        """
        Handle the response for a ReadFile (gap fill) operation.

        Args:
            response_op (mavftp_op.FTP_OP): The FTP operation response to handle.

        Returns:
            bool: True if reading is complete, False otherwise.
        """
        if response_op.opcode == mavftp_op.OP_Ack and response_op.payload:
            gap = (response_op.offset, response_op.size)

            if gap in self.read_gaps:
                self.read_gaps.remove(gap)
                current_pos = self.read_buffer.tell()

                # Write gap data
                self.read_buffer.seek(response_op.offset)
                self.read_buffer.write(response_op.payload)
                self.read_total += len(response_op.payload)
                self.read_buffer.seek(current_pos)

                self.drone.logger.debug(
                    f"Filled gap at offset {response_op.offset}, size {response_op.size}"
                )

                # Check if all gaps are filled
                if len(self.read_gaps) == 0 and (
                    self.reached_eof or self.read_total >= self.requested_size
                ):
                    return True

        elif response_op.opcode == mavftp_op.OP_Nack:
            self.drone.logger.error(
                f"Failed to read gap at offset {response_op.offset}"
            )

        return False

    def _requestGaps(self) -> None:
        """Request missing data chunks (gaps) using OP_ReadFile."""
        for gap_offset, gap_size in self.read_gaps[
            :5
        ]:  # Request up to 5 gaps at a time
            read_op = mavftp_op.FTP_OP(
                self.seq,
                self.session,
                mavftp_op.OP_ReadFile,
                gap_size,
                0,
                0,
                gap_offset,
                None,
            )
            self._sendFtpCommand(read_op)
            self.drone.logger.debug(
                f"Requesting gap: offset={gap_offset}, size={gap_size}"
            )
