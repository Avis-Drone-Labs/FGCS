import sys

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
