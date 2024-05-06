"""
Global values to be used by the endpoints. We aren't sure if this is fully the correct way of doing this but it seems to work. Each file
imports this and access it, it can update the values and every other file will also have the update due to passing by reference (probably).
"""
from typing import Optional, List
from app.drone import Drone

correct_ports: List[str] = []
drone: Optional[Drone] = None
state = None
