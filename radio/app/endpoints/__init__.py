from flask import Blueprint

endpoints = Blueprint("endpoints", __name__)

# Ignore warnings from VSCode, these are used in /app/__init__.py for registering the blueprint
from . import arm
from . import autopilot
from . import comPorts
from . import connections
from . import flightMode
from . import gripper
from . import mission
from . import motors
from . import params
from . import states
