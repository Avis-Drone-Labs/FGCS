import os
import sys
import time
import json
import glob
import logging

from typing import Dict, Optional
from pathlib import Path
from werkzeug.serving import is_running_from_reloader

def get_settings_path() -> Optional[str]:
    """Gets the path of the user settings based on the current operating system

    This should be AppData/Roaming/FGCS/settings.json for windows,
    ~/.config/FGCS/settings.json for linux-based systems and
    ~/Library/Application Support/FGCS/settings.json for MacOS

    Returns:
        Optional[str]: The path to the settings file, or `None` if the platform cannot be determined
    """
    if (platform := sys.platform) in ["win32", "cygwin"]:
        if (appdata := os.getenv('APPDATA')) is None:
            raise EnvironmentError("Could not read %APPDATA% environment variable.")
        return os.path.join(appdata, "FGCS", "settings.json")
    elif platform == "linux":
        return os.path.join("~", '.config', 'FGCS', 'settings.json')
    elif platform == "darwin":
        return os.path.join("~", 'Library', 'Application Support', 'FGCS')

    return None

def load_user_logging_settings() -> Dict:
    """Load the user's logging configuration

    TODO: Currently this just uses hard coded defaults for the logging settings that we need
    Since we are likely to want backend settings at some point should probably create a proper
    module for loading the defaults and user settings and getting them

    Returns:
        dict: The users's logging configuration
    """
    
    DEFAULTS = {"logDirectory": "", "onlyKeepLastLog": False, "combineLogs": False}
    
    user_settings_path = get_settings_path()
    
    if not user_settings_path:
        return DEFAULTS
    
    with open(user_settings_path, "r") as f:
        log_settings = json.load(f).get("settings", {}).get("General", {})
        
    return {
        k: log_settings.get(k, DEFAULTS[k]) for k in DEFAULTS.keys()
    }


def get_latest_log(log_dir: Path) -> str:
    """Get the last backend log so that we can overwrite it if werkzeug is attempting to create
    two files

    Args:
        log_dir (Path): The directory of FGCS logs

    Returns:
        str: The name of the last modified backend log file
    """
    logs = glob.glob(os.path.join(log_dir, "backend*.log"))
    return max(logs, key=os.path.getmtime)

def get_log_name(log_dir: str, keep_latest: bool, combine_logs: bool) -> str:
    """Get the log name given the user's settings
    
    """
    
    reloaded = is_running_from_reloader()
    
    if reloaded:
        return get_latest_log(log_dir)
    
    if keep_latest or combine_logs:
        return "backend.log"
    
    current_time = time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime())
    return f"backend-{current_time}.log"

def get_log_directory(log_dir: str, combine_logs: str) -> str:
    """Get the correct logging directory based on the user's settings,
    and create the directory if it does not already exist
    
    If the user wants logs to be combined then temporary logs are placed in FGCS/tmp
    
    Args:
        log_dir (str): The directory the user has requested (from the user settings)
        combine_logs (bool): Whether the user wants both frontend and backend logs to be in the same file
    """
    
    dir = log_dir or Path.home().joinpath("FGCS", "logs")
    
    if combine_logs:
        dir = str(Path.home().joinpath("FGCS", "tmp"))
        
    if not os.path.isdir(dir):
        os.mkdir(dir)
        
    return dir
    
    
def setup_logging(format: str = "[%(asctime)s:%(msecs)03d] [%(levelname)s] backend - %(message)s") -> logging.Logger:
    """Setup logging for the application

    Configures the default logger (fgcs) and the werkzeug logger, routes them to a file based on the user's
    settings

    Args:
        format (str, optional): The format for the file logging. Defaults to "%(asctime)s - %(name)s - %(levelname)s - %(message)s".

    Returns:
        logging.Logger: The default logger (```logging.getLogger("fgcs")```)
    """

    log_dir, keep_last, combine_logs = load_user_logging_settings().values()
    
    log_directory = get_log_directory(log_dir, combine_logs)

    # use tmp directory if user wants logs to be combined to one file, otherwise use user defined setting or FGCS/logs
    log_directory = Path.home().joinpath("FGCS", "tmp") if user_settings["combine_logs"] else (user_settings["log_dir"] or Path.home().joinpath("FGCS", "logs"))

    if not os.path.isdir(log_directory):
        os.mkdir(log_directory)

    log_name = get_log_name(log_directory, keep_last, combine_logs)

    log_path = Path(log_directory).joinpath(log_name)
    file_handler = logging.FileHandler(log_path, "w+")
    file_handler.setFormatter(logging.Formatter(format, datefmt="%d/%m/%Y %H:%M:%S"))

    logger = logging.getLogger("fgcs")
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)

    flask_logger = logging.getLogger("werkzeug")
    # No werkzeug INFO because we use sockets and werkzeug socket INFO logs are useless :D
    flask_logger.setLevel(logging.WARNING)
    flask_logger.addHandler(file_handler)

    return logger
