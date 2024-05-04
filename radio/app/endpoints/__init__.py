from flask import Blueprint

endpoints = Blueprint("endpoints", __name__)

# Ignore warnings from VSCode, these are used in /app/__init__.py for registering the blueprint
from . import arm # noqa: F401, E402
from . import autopilot # noqa: F401, E402
from . import comPorts # noqa: F401, E402
from . import connections # noqa: F401, E402
from . import flightMode # noqa: F401, E402
from . import gripper # noqa: F401, E402
from . import mission # noqa: F401, E402
from . import motors # noqa: F401, E402
from . import params # noqa: F401, E402
from . import states # noqa: F401, E402
