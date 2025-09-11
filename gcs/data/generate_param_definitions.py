import json
import lzma
import os
from urllib.request import urlretrieve

# https://autotest.ardupilot.org/Parameters/
param_defs = [
    [
        "https://autotest.ardupilot.org/Parameters/ArduCopter/apm.pdef.json.xz",
        "gen_apm_params_def_copter.json",
    ],
    [
        "https://autotest.ardupilot.org/Parameters/ArduPlane/apm.pdef.json.xz",
        "gen_apm_params_def_plane.json",
    ],
]

temp_file_name = "temp.pdef.json.xz"

if os.path.exists(temp_file_name):
    os.remove(temp_file_name)

for url, output_filename in param_defs:
    urlretrieve(url, temp_file_name)
    with lzma.open(temp_file_name) as f:
        data = f.read()
        json_data = json.loads(data)

    with open(output_filename, "w") as f:
        del json_data["json"]

        params = {}

        for item in json_data:
            params.update(json_data[item])

        sorted_params = dict(sorted(params.items()))

        json.dump(sorted_params, f)

if os.path.exists(temp_file_name):
    os.remove(temp_file_name)

print("Generated param definition files")
