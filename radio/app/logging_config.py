import os
import sys
import time
import json
import glob
import logging

from typing import Dict
from pathlib import Path
from werkzeug.serving import is_running_from_reloader

def get_settings_path() -> str:
    """Gets the path of the user settings based on the current operating system

    This should be AppData/Roaming/FGCS/settings.json for windows,
    ~/.config/FGCS/settings.json for linux-based systems and
    ~/Library/Application Support/FGCS/settings.json

    Returns:
        str: The path to the settings file
    """
    if (platform := sys.platform) in ["win32", "cygwin"]:
        if (appdata := os.getenv('APPDATA')) is None:
            raise EnvironmentError("Could not read %APPDATA% environment variable.")
        return os.path.join(appdata, "FGCS", "settings.json")
    elif platform == "linux":
        return os.path.join("~", '.config', 'FGCS', 'settings.json')
    elif platform == "darwin":
        return os.path.join("~", 'Library', 'Application Support', 'FGCS')

    raise OSError("Unknown platform. Are you running TempleOS?")

def load_user_logging_settings() -> Dict:
    """Load the user's logging configuration

    Returns:
        dict: The users's logging configuration
    """
    with open(get_settings_path(), "r") as f:
        log_settings = json.load(f).get("settings", {}).get("General", {})
    return {"log_dir": log_settings.get("logDirectory", ""), "only_keep_latest": log_settings.get("onlyKeepLastLog", False)}


def get_latest_log(log_dir: Path) -> str:
    """Get the last backend log so that we can overwrite it if werkzeug is attempting to create
    two files

    Args:
        log_dir (Path): The directory of FGCS logs

    Returns:
        str: The name of the last modified backend log file
    """
    logs = glob.glob(os.path.join(log_dir, "*.log"))
    return max(logs, key=os.path.getmtime)

def setup_logging(format: str = "[%(asctime)s] [%(levelname)s] %(message)s") -> logging.Logger:
    """Setup logging for the application

    Configures the default logger (fgcs) and the werkzeug logger, routes them to a file based on the user's
    settings

    Args:
        format (str, optional): The format for the file logging. Defaults to "%(asctime)s - %(name)s - %(levelname)s - %(message)s".

    Returns:
        logging.Logger: The default logger (```logging.getLogger("fgcs")```)
    """

    reloaded = is_running_from_reloader()

    user_settings = load_user_logging_settings()

    start_time = time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime())
    log_directory = user_settings["log_dir"] or Path.home().joinpath("FGCS", "logs")

    if not reloaded:
        log_name = "backend.log" if user_settings["only_keep_latest"] else f"backend_{start_time}.log"
    else:
        log_name = get_latest_log(log_directory)

    log_path = Path(log_directory).joinpath(log_name)

    file_handler = logging.FileHandler(log_path, "w+")
    file_handler.setFormatter(logging.Formatter(format))

    logger = logging.getLogger("fgcs")
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    logger.addHandler(logging.StreamHandler(sys.stderr))

    flask_logger = logging.getLogger("werkzeug")
    # No werkzeug INFO because we use sockets and werkzeug socket INFO logs are useless :D
    flask_logger.setLevel(logging.WARNING)
    flask_logger.addHandler(file_handler)

    return logger
