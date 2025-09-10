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

if os.path.exists("temp.pdef.json.xz"):
    os.remove("temp.pdef.json.xz")

for url, output_filename in param_defs:
    urlretrieve(url, "temp.pdef.json.xz")
    with lzma.open("temp.pdef.json.xz") as f:
        data = f.read()
        json_data = json.loads(data)

    with open(output_filename, "w") as f:
        del json_data["json"]

        params = {}

        for item in json_data:
            params.update(json_data[item])

        sorted_params = dict(sorted(params.items()))

        json.dump(sorted_params, f)

if os.path.exists("temp.pdef.json.xz"):
    os.remove("temp.pdef.json.xz")

print("Generated param definition files")
