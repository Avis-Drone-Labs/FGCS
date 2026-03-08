#!/bin/sh

# Information for first time running (cba to actually make it do all this)
echo "THIS NEEDS TO BE RAN IN SUDO"
echo "If you get errors, you'll need to clone with:"
echo "sudo docker pull kushmakkapati/ardupilot_sitl"
echo ""

# Run
sudo systemctl start docker.service
sudo docker run -it --rm -p 5760:5760 kushmakkapati/ardupilot_sitl

# Stop
sudo systemctl stop docker.service
sudo systemctl stop docker.socket

# Goodybye message
echo ""
echo "Stopped!"
