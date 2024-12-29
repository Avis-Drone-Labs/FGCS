#!/bin/bash
# Make sure line endings are LF for this file!!!

LAT=52.780569089726455
LON=-0.707923685716297
ALT=0
DIR=270
VEHICLE="ArduCopter"

for ARGUMENT in "$@"
do
   KEY=$(echo $ARGUMENT | cut -f1 -d=)

   KEY_LENGTH=${#KEY}
   VALUE="${ARGUMENT:$KEY_LENGTH+1}"

   export "$KEY"="$VALUE"
done

exec python /sitl_setup/mission_upload.py &
exec python /ardupilot/Tools/autotest/sim_vehicle.py -v $VEHICLE --custom-location=$LAT,$LON,$ALT,$DIR --no-mavproxy --add-param-file=/sitl_setup/custom_params.parm
