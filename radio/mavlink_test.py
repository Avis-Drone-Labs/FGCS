import time

from drone import Drone
from utils import getComPort

# from influxdb_client import InfluxDBClient, Point
# from influxdb_client.client.write_api import SYNCHRONOUS

# token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

# org = "Project Falcon"
# url = "http://localhost:8086"
# bucket = "telemetry"

# db_client = InfluxDBClient(url=url, token=token, org=org)
# write_api = db_client.write_api(write_options=SYNCHRONOUS)


def test_cb(msg):
    print(msg.param_id)
    # print(datetime.datetime.now().time(), datetime.datetime.fromtimestamp(msg._timestamp).time(), msg.rpm)


if __name__ == "__main__":
    port = getComPort()
    drone = Drone(port)

    drone.getAllParams()

    drone.addMessageListener("PARAM_VALUE", test_cb)

    try:
        while True:
            time.sleep(0.05)
    except KeyboardInterrupt:
        drone.close()

    # write_api.close()
    # db_client.close()
