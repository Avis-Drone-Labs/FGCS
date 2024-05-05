from flask import Blueprint
from . import arm as _
from . import autopilot as _
from . import comPorts as _
from . import connections as _
from . import flightMode as _
from . import gripper as _
from . import mission as _
from . import motors as _
from . import params as _
from . import states as _

endpoints = Blueprint("endpoints", __name__)
