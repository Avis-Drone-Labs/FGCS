from flask import Blueprint

endpoints = Blueprint("endpoints", __name__)

# Ignore warnings, importing everything from this file for the blueprint
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
