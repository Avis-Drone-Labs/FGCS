import time

from dronekit import connect
from utils import getComPort


def battery_callback(self, attr_name, value):
    print(value)


port = getComPort()
drone = connect(port, wait_ready=True, baud=57600)
print("Connected to drone")

drone.add_attribute_listener("battery", battery_callback)

try:
    while 1:
        time.sleep(1)
except KeyboardInterrupt:
    pass

drone.close()
