import sys
import pytest
from tests import setupDrone
from app.utils import getComPort
from app.drone import Drone

if __name__ == "__main__":
    if sys.argv[-1] == "-nfc":
        print("\033[1;32;40mRunning in no flight controller mode \033[0m")
    else:
        print("\033[1;31;40mIF YOU DON'T HAVE A FLIGHT CONTROLLER, PLEASE RUN WITH -nfc \033[0m")
        port = getComPort()
        print("\nThe below is debugging from the Drone class:")

        drone = Drone(port)
        setupDrone(drone)
        print("\nDrone has been setup!")

    # Run pytest
    print("Starting tests...")
    pytest.main(["-r", "./tests/", "-svv", "--disable-warnings"])
