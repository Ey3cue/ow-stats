#!/bin/bash

set -o xtrace

if [[ $EUID != 0 ]]; then
  echo "Must run as root"
  exit 1
fi

if [[ $1 != "remove" ]]; then
  # Install
  set -o errexit
  
  systemctl stop ow-stats

  command -v node
  command -v npm
  command -v systemctl

  mkdir -vp /opt/ow-stats/

  cp -rv app/ /opt/ow-stats/
  cp -v main.js /opt/ow-stats/
  cp -v package.json /opt/ow-stats/

  pushd /opt/ow-stats
  npm install
  popd

  cp -v install/ow-stats.service /etc/systemd/system/
  echo "Enabling and starting service"
  systemctl daemon-reload
  systemctl enable ow-stats
  systemctl start ow-stats

  echo "Installed"

else
  # Uninstall
  echo "Stopping and disabling service"
  systemctl stop ow-stats
  systemctl disable ow-stats
  rm -v /etc/systemd/system/ow-stats.service
  systemctl daemon-reload

  rm -rv /opt/ow-stats

  echo "Uninstalled"
fi