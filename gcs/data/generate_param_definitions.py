import glob
import json
import os
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

GITHUB_API_ROOT = "https://api.github.com/repos/ArduPilot/ParameterRepository/contents"
GITHUB_RAW_ROOT = "https://raw.githubusercontent.com/ArduPilot/ParameterRepository/main"
VEHICLES = ("Plane", "Copter")
OUTPUT_MANIFEST = "gen_apm_params_versions.json"
REQUEST_TIMEOUT_SECONDS = 30


def fetch_json(url: str):
    request = Request(url, headers={"User-Agent": "FGCS Param Definition Generator"})
    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return json.loads(response.read().decode("utf-8"))


def cleanup_old_generated_files() -> None:
    for legacy_file in (
        "gen_apm_params_def_plane.json",
        "gen_apm_params_def_copter.json",
    ):
        if os.path.exists(legacy_file):
            os.remove(legacy_file)

    for pattern in (
        "gen_apm_params_def_plane_*.json",
        "gen_apm_params_def_copter_*.json",
    ):
        for file_path in glob.glob(pattern):
            os.remove(file_path)

    if os.path.exists(OUTPUT_MANIFEST):
        os.remove(OUTPUT_MANIFEST)


def discover_versions_by_vehicle() -> dict[str, list[str]]:
    root_entries = fetch_json(GITHUB_API_ROOT)
    versions_by_vehicle: dict[str, list[str]] = {"Plane": [], "Copter": []}

    for entry in root_entries:
        if entry.get("type") != "dir":
            continue

        match = re.match(r"^(Plane|Copter)-4\.(\d+)$", entry.get("name", ""))
        if not match:
            continue

        vehicle = match.group(1)
        minor = int(match.group(2))
        versions_by_vehicle[vehicle].append(f"4.{minor}")

    for vehicle in VEHICLES:
        versions_by_vehicle[vehicle] = sorted(
            set(versions_by_vehicle[vehicle]),
            key=lambda version: int(version.split(".")[1]),
        )

    return versions_by_vehicle


def flatten_param_definition(raw_definition: dict) -> dict:
    raw_definition.pop("json", None)

    params = {}
    for value in raw_definition.values():
        if isinstance(value, dict):
            params.update(value)

    return dict(sorted(params.items()))


def write_output_file(file_name: str, data: dict) -> None:
    with open(file_name, "w", encoding="utf-8") as file:
        json.dump(data, file)


def generate() -> None:
    cleanup_old_generated_files()

    versions_by_vehicle = discover_versions_by_vehicle()
    manifest: dict[str, Any] = {
        "source": "ArduPilot ParameterRepository",
        "repository": "https://github.com/ArduPilot/ParameterRepository",
        "vehicles": {
            "plane": {"versions": [], "latest": None, "files": {}},
            "copter": {"versions": [], "latest": None, "files": {}},
        },
    }

    for vehicle in VEHICLES:
        discovered_versions = versions_by_vehicle.get(vehicle, [])
        if not discovered_versions:
            raise RuntimeError(f"No 4.x versions discovered for {vehicle}")

        print(f"Discovered {vehicle} versions: {', '.join(discovered_versions)}")

        key = vehicle.lower()
        manifest["vehicles"][key]["versions"] = discovered_versions
        manifest["vehicles"][key]["latest"] = discovered_versions[-1]

        for version in discovered_versions:
            source_url = f"{GITHUB_RAW_ROOT}/{vehicle}-{version}/apm.pdef.json"
            output_name = f"gen_apm_params_def_{key}_{version}.json"

            try:
                raw_definition = fetch_json(source_url)
                flattened_definition = flatten_param_definition(raw_definition)
                write_output_file(output_name, flattened_definition)
                manifest["vehicles"][key]["files"][version] = output_name
                print(f"Generated {output_name}")
            except (HTTPError, URLError, json.JSONDecodeError) as error:
                raise RuntimeError(
                    f"Failed to fetch {vehicle}-{version} from {source_url}: {error}"
                ) from error

    write_output_file(OUTPUT_MANIFEST, manifest)
    print(f"Generated {OUTPUT_MANIFEST}")
    print("Generated versioned param definition files")


if __name__ == "__main__":
    generate()
