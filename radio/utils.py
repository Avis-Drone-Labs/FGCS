import sys

from pymavlink import mavutil
from serial.tools import list_ports


def getComPort() -> str:
    while True:
        ports = list(list_ports.comports())

        print("Available COM ports:")
        for i in range(len(ports)):
            port = ports[i]
            print(f"\t[{i}]\t{port.name}: {port.description}")

        inp_port = input("Enter a port index to connect to: ")
        if not inp_port.isdigit():
            continue

        inp_port_num = int(inp_port)
        if 0 <= inp_port_num < len(ports):
            break

    if sys.platform == "darwin":
        port_name = ports[inp_port_num].name
        if port_name[:3] == "cu.":
            port_name = port_name[3:]

        port_name = f"/dev/tty.{port_name}"
    elif sys.platform in ["linux", "linux2"]:
        port_name = f"/dev/{ports[inp_port_num].name}"
    else:
        port_name = ports[inp_port_num].name

    return port_name


def getComPortNames():
    ports = list(list_ports.comports())
    correct_ports = []
    for i in range(len(ports)):
        port = ports[i]
        if sys.platform == "darwin":
            port_name = port.name
            if port_name[:3] == "cu.":
                port_name = port_name[3:]

            port_name = f"/dev/tty.{port_name}"
        elif sys.platform in ["linux", "linux2"]:
            port_name = f"/dev/{port.name}"
        else:
            port_name = port.name

        correct_ports.append(port_name)

    return correct_ports


def secondsToMicroseconds(secs):
    return secs * 1e6


def commandAccepted(response, command):
    """Check if a command has been accepted"""
    return (
        response
        and response.command == command
        and response.result == mavutil.mavlink.MAV_RESULT_ACCEPTED
    )


def normalisePwmValue(val, min_val=1000, max_val=2000):
    """Normalise a PWM value to the range -1 to 1"""
    return 2 * ((val - min_val) / (max_val - min_val)) - 1
    return 2 * ((val - min_val) / (max_val - min_val)) - 1
