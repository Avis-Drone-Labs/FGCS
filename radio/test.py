import time

from influxdb_client import InfluxDBClient, WriteOptions

token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

org = "Project Falcon"
url = "http://localhost:8086"
bucket = "test"

db_client = InfluxDBClient(url=url, token=token, org=org)
write_api = db_client.write_api(
    write_options=WriteOptions(batch_size=100, flush_interval=10000)
)

start = time.perf_counter()
for i in range(600):
    # point = Point("test").field("val", 1).field("time", time.time_ns())
    point = f"test val=1 {time.time_ns()}\n"

    start_w = time.perf_counter()

    write_api.write(bucket=bucket, org="Project Falcon", record=point)
    print(time.perf_counter() - start_w)
    time.sleep(0.1)

print()
print(time.perf_counter() - start)

# 2023-12-07T02:41:59.519Z
# 2023-12-07T02:42:19.177Z


# async def write(write_api, point):
#     await write_api.write(bucket=bucket, org="Project Falcon", record=point)


# async def main():
#     db_client = InfluxDBClientAsync(url=url, token=token, org=org, enable_gzip=True)
#     write_api = db_client.write_api()

#     loop = asyncio.get_running_loop()
#     # asyncio.set_event_loop(loop)
#     # loop.run_forever()

#     start = time.perf_counter()
#     for i in range(80):
#         point = Point("test").field("val", 1)

#         start_w = time.perf_counter()
#         await write(write_api, point)

#         print(time.perf_counter() - start_w)
#         time.sleep(0.25)
#     print(time.perf_counter() - start)


# if __name__ == "__main__":
#     asyncio.run(main())
