import sys

from colorama import Fore, Style
from serial.tools import list_ports


def getComPort() -> str:
    while True:
        ports = list(list_ports.comports())

        print(f"{Style.BRIGHT}{Fore.BLUE}Available COM ports:")
        for i in range(len(ports)):
            port = ports[i]
            print(f"{Style.BRIGHT}{Fore.BLUE}\t[{i}]\t{port.name}: {port.description}")

        inp_port = input(f"{Fore.YELLOW}Enter a port index to connect to: ")
        if not inp_port.isdigit():
            continue

        inp_port_num = int(inp_port)
        if 0 <= inp_port_num < len(ports):
            break

    print(Style.RESET_ALL)

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
