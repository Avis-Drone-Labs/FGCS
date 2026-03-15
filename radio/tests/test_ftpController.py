from typing import List

from pymavlink import mavftp


def test_convertDirectoryEntriesToDicts_success(drone_status):
    entries: List[mavftp.DirectoryEntry] = [
        mavftp.DirectoryEntry(name=".", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="..", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="file1.txt", is_dir=False, size_b=1234),
        mavftp.DirectoryEntry(name="folder1", is_dir=True, size_b=0),
    ]

    result = drone_status.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/"
    )

    assert result == [
        {"name": ".", "path": "/", "is_dir": True, "size_b": 0},
        {"name": "..", "path": "/", "is_dir": True, "size_b": 0},
        {"name": "file1.txt", "path": "/file1.txt", "is_dir": False, "size_b": 1234},
        {"name": "folder1", "path": "/folder1", "is_dir": True, "size_b": 0},
    ]


def test_convertDirectoryEntriesToDicts_subPathSuccess(drone_status):
    entries: List[mavftp.DirectoryEntry] = [
        mavftp.DirectoryEntry(name=".", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="..", is_dir=True, size_b=0),
        mavftp.DirectoryEntry(name="file1.txt", is_dir=False, size_b=1234),
        mavftp.DirectoryEntry(name="folder1", is_dir=True, size_b=0),
    ]

    result = drone_status.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/test/path"
    )

    assert result == [
        {"name": ".", "path": "/test/path", "is_dir": True, "size_b": 0},
        {"name": "..", "path": "/test", "is_dir": True, "size_b": 0},
        {
            "name": "file1.txt",
            "path": "/test/path/file1.txt",
            "is_dir": False,
            "size_b": 1234,
        },
        {"name": "folder1", "path": "/test/path/folder1", "is_dir": True, "size_b": 0},
    ]


def test_convertDirectoryEntriesToDicts_emptyEntriesNoPath_success(drone_status):
    entries: List[mavftp.DirectoryEntry] = []

    result = drone_status.drone.ftpController._convertDirectoryEntriesToDicts(entries)

    assert result == []


def test_convertDirectoryEntriesToDicts_emptyEntries_success(drone_status):
    entries: List[mavftp.DirectoryEntry] = []

    result = drone_status.drone.ftpController._convertDirectoryEntriesToDicts(
        entries, "/"
    )

    assert result == []


def test_listFiles_blockedByCurrentOp(drone_status):
    """Test that listFiles is blocked when another operation is in progress"""
    drone_status.drone.ftpController.current_op = "read_file"

    result = drone_status.drone.ftpController.listFiles("/")

    assert result == {
        "success": False,
        "message": "FTP operation already in progress: read_file",
    }

    drone_status.drone.ftpController.current_op = None


def test_readFile_blockedByCurrentOp(drone_status):
    """Test that readFile is blocked when another operation is in progress"""
    drone_status.drone.ftpController.current_op = "list_files"

    result = drone_status.drone.ftpController.readFile("/test.txt")

    assert result == {
        "success": False,
        "message": "FTP operation already in progress: list_files",
    }

    drone_status.drone.ftpController.current_op = None


def test_currentOp_clearedOnListFilesError(drone_status):
    """Test that current_op is cleared even when listFiles fails"""
    assert drone_status.drone.ftpController.current_op is None

    result = drone_status.drone.ftpController.listFiles("")

    assert result == {"success": False, "message": "Path cannot be empty"}
    # Verify current_op is still None after error
    assert drone_status.drone.ftpController.current_op is None


def test_currentOp_clearedOnReadFileError(drone_status):
    """Test that current_op is cleared even when readFile fails"""
    assert drone_status.drone.ftpController.current_op is None

    result = drone_status.drone.ftpController.readFile("")

    assert result == {"success": False, "message": "File path cannot be empty"}

    # Verify current_op is still None after error
    assert drone_status.drone.ftpController.current_op is None


def test_multipleOperations_sequential(drone_status):
    """Test that operations can run sequentially after previous one completes"""
    # Verify current_op is None initially
    assert drone_status.drone.ftpController.current_op is None

    # First operation with empty path (will fail but clear current_op)
    result1 = drone_status.drone.ftpController.listFiles("")
    assert result1 == {"success": False, "message": "Path cannot be empty"}
    assert drone_status.drone.ftpController.current_op is None

    # Second operation should be allowed since first is complete
    result2 = drone_status.drone.ftpController.readFile("")
    assert result2 == {"success": False, "message": "File path cannot be empty"}
    assert drone_status.drone.ftpController.current_op is None

    # Third operation should also be allowed
    result3 = drone_status.drone.ftpController.listFiles("")
    assert result3 == {"success": False, "message": "Path cannot be empty"}
    assert drone_status.drone.ftpController.current_op is None
