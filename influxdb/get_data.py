from influxdb_client import InfluxDBClient
import time

token = "EKU_pTBZbvTIAF7mRPiNerKdS69vBXVY0zfXtWmvkdFLcD6DGGhel89J9IuzAjg9jljbuB06fQOJZIkI1rJ35g=="

org = "Project Falcon"
url = "http://localhost:8086"
bucket = "telemetry"

db_client = InfluxDBClient(url=url, token=token, org=org)
query_api = db_client.query_api()
query = query_api.query(
    f"""
    from(bucket:"{bucket}")
    |> range(start: 2023-12-04T16:00:48Z, stop: 2023-12-04T16:01:36Z)
    |> filter(fn: (r) => r["_measurement"] == "vfr_hud")
    |> filter(fn: (r) => r["_field"] == "throttle")
"""
)

for table in query:
    for idx, record in enumerate(table.records):
        print(record.get_value())
        if idx != len(table.records) - 1:
            time_diff = table.records[idx + 1].get_time() - record.get_time()
            time.sleep(time_diff.microseconds / 1_000_000)
