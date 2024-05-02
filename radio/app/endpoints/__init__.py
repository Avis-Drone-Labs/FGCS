from flask import Blueprint

main = Blueprint("main", __name__)

# Ignore warnings, importing everything from this file for the blueprint
from . import connections
from . import comPorts
