import json
import lzma
import os
import xml.etree.ElementTree as ET
from urllib.request import urlretrieve

# https://autotest.ardupilot.org/LogMessages/
log_message_defs = [
    [
        "https://autotest.ardupilot.org/LogMessages/Copter/LogMessages.xml.xz",
        "gen_log_messages_desc_copter.json",
    ],
    [
        "https://autotest.ardupilot.org/LogMessages/Plane/LogMessages.xml.xz",
        "gen_log_messages_desc_plane.json",
    ],
]

temp_file_name = "temp.LogMessages.xml.xz"

if os.path.exists(temp_file_name):
    os.remove(temp_file_name)

for url, output_filename in log_message_defs:
    print(f"Downloading {url}...")
    urlretrieve(url, temp_file_name)

    with lzma.open(temp_file_name) as f:
        data = f.read()

    # Parse XML
    root = ET.fromstring(data)

    # Convert XML to JSON structure
    log_messages = {}

    for log_msg in root.findall("logformat"):
        name = log_msg.get("name")
        if name:
            fields = {}

            # Get all field elements
            for field in log_msg.findall("fields/field"):
                field_name = field.get("name")
                field_description_elem = field.find("description")
                field_description = ""
                if field_description_elem is not None and field_description_elem.text:
                    field_description = field_description_elem.text.strip()

                field_info = {
                    "type": field.get("type"),
                    "units": field.get("units", ""),
                    "description": field_description,
                }
                fields[field_name] = field_info

            # Get description
            description_elem = log_msg.find("description")
            description = ""
            if description_elem is not None and description_elem.text:
                description = description_elem.text.strip()

            log_messages[name] = {"description": description, "fields": fields}

    # Sort by message name and write to JSON file
    sorted_log_messages = dict(sorted(log_messages.items()))

    with open(output_filename, "w") as f:
        json.dump(sorted_log_messages, f)

    print(f"Generated {output_filename}")

if os.path.exists(temp_file_name):
    os.remove(temp_file_name)

print("Generated log message description files")
