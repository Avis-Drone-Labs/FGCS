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
        "longitude": round(random.uniform(5, 60), 4),
        "latitude": round(random.uniform(5, 60), 4)
    }

    return mock_data

"""
Box Coordinates:
TOP LEFT : 52.782902, -0.709830
BOTTOM RIGHT : 52.779910, -0.704262
"""

def createMockFlightPath():
    noOfPoints = 10
    coordinates = [(random.randint(52779910, 52782902)/1000000, -random.randint(704262, 709830)/1000000) for _ in range(noOfPoints)]
    file = open("mocking/flight_path.txt", "w")
    file.write("0")
    for x in coordinates:
        file.write("\n" + str(round(x[0], 4)) + " " + str(round(x[1], 4)))
    file.close()