import time
from pprint import pprint

from app.drone import Drone
from app.utils import getComPort

# from influxdb_client import InfluxDBClient, Point
# from influxdb_client.client.write_api import SYNCHRONOUS

# token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

# org = "Project Falcon"
# url = "http://localhost:8086"
# bucket = "telemetry"

# db_client = InfluxDBClient(url=url, token=token, org=org)
# write_api = db_client.write_api(write_options=SYNCHRONOUS)


def test_cb(msg=None):
    print(msg)
    # print(datetime.datetime.now().time(), datetime.datetime.fromtimestamp(msg._timestamp).time(), msg.rpm)


if __name__ == "__main__":
    port = getComPort()
    drone = Drone(port, droneErrorCb=test_cb, droneDisconnectCb=test_cb)

    pprint([item.to_dict() for item in drone.flight_modes.flight_modes])

    # print(drone.gripper.doGripper("release"))
    # drone.master.waypoint_request_list_send()
    # drone.master.mav.mission_request_list_send(
    #     drone.target_system, drone.target_component, mission_type=2
    # )

    # drone.setGripper("release")
    # time.sleep(1)
    # drone.setGripper("grab")

    drone.setupDataStreams()
    drone.addMessageListener("ATTITUDE", test_cb)

    # time.sleep()

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

    # drone.addMessageListener("MISSION_COUNT", test_cb)

    try:
        while True:
            time.sleep(0.05)
    except KeyboardInterrupt:
        drone.close()

    # write_api.close()
    # db_client.close()
