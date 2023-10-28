import random


def mockTelemetryData():
    mock_data = {
        "status": random.choice(
            [
                "CALIBRATING",
                "STANDBY",
                "ACTIVE",
                "CRITICAL",
                "EMERGENCY",
                "FLIGHT_TERMINATION",
            ]
        ),
        "altitude": round(random.uniform(10, 40), 4),
        "airspeed": round(random.uniform(0, 15), 4),
        "groundspeed": round(random.uniform(0, 15), 4),
        "battery_remaining": round(random.randint(15, 100), 4),
        "battery_voltage": round(random.uniform(18, 22.2), 4),
        "battery_current": round(random.uniform(5, 60), 4),
    }

    return mock_data
