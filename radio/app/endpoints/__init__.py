from flask import Blueprint
from . import arm as arm
from . import autopilot as autopilot
from . import comPorts as comPorts
from . import connections as connections
from . import flightMode as flightMode
from . import gripper as gripper
from . import mission as mission
from . import motors as motors
from . import params as params
from . import states as states

endpoints = Blueprint("endpoints", __name__)
