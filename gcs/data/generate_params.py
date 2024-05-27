import json

# https://autotest.ardupilot.org/Parameters/
input_filename = "apm.pdef.json"
output_filename = "gen_apm_params_def_plane.json"

with open(input_filename, "r") as f:
    data = json.load(f)
    del data["json"]

    params = {}

    for item in data:
        params.update(data[item])

sorted_params = dict(sorted(params.items()))

with open(output_filename, "w") as f:
    json.dump(sorted_params, f)
