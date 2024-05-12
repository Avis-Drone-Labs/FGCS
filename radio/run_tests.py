import pytest
from tests import setupDrone
from app.utils import getComPort
from app.drone import Drone

if __name__ == "__main__":
    port = getComPort()
    print("\nThe below is debugging from the Drone class:")
    drone = Drone(port)
    setupDrone(drone)
    print("\nDrone has been setup!")
    print("Starting tests...")

    # Run pytest
    pytest.main(["-r", "./tests/", "-svv", "--disable-warnings"])
