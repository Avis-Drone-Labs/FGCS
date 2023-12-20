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
    print(msg.msgname)
    # print(datetime.datetime.now().time(), datetime.datetime.fromtimestamp(msg._timestamp).time(), msg.rpm)


if __name__ == "__main__":
    port = getComPort()
    drone = Drone(port)

    # drone.setupDataStreams()
    # drone.getAllParams()

    # params_to_set = [
    #     {
    #         'param_name': 'FLTMODE5',
    #         'param_value': 0,
    #         'param_type': 2,
    #     },
    #     {
    #         'param_name': 'FLTMODE6',
    #         'param_value': 9,
    #         'param_type': 2,
    #     },
    # ]

    # time.sleep(1)
    # print(drone.setMultipleParams(params_to_set))
    # print(drone.params)

    # drone.addMessageListener("PARAM_VALUE", test_cb)

    try:
        while True:
            time.sleep(0.05)
    except KeyboardInterrupt:
        drone.close()

    # write_api.close()
    # db_client.close()
