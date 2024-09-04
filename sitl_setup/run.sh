#!/bin/bash

LAT=52.780569089726455
LON=-0.707923685716297
ALT=0
DIR=270

exec python /sitl_setup/mission_upload.py &
exec python /ardupilot/Tools/autotest/sim_vehicle.py -v ArduCopter --custom-location=$LAT,$LON,$ALT,$DIR --no-mavproxy
