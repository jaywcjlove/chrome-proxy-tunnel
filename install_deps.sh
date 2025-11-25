#!/bin/bash

# Check for root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

echo "Installing dependencies for Puppeteer..."

if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    echo "Detected Debian/Ubuntu system."
    apt-get update
    apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    echo "Detected CentOS/RHEL system."
    yum install -y alsa-lib.x86_64 atk.x86_64 cups-libs.x86_64 gtk3.x86_64 ipa-gothic-fonts libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXrandr.x86_64 libXScrnSaver.x86_64 libXtst.x86_64 pango.x86_64 xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-utils
elif grep -q "Amazon Linux" /etc/os-release; then
    # Amazon Linux 2023
    echo "Detected Amazon Linux."
    dnf install -y alsa-lib atk cups-libs gtk3 libXcomposite libXcursor libXdamage libXext libXi libXrandr libXScrnSaver libXtst pango xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-utils libdrm libgbm nss

else
    echo "Unsupported Linux distribution."
    if [ -f /etc/os-release ]; then
        echo "OS Release Info:"
        cat /etc/os-release
    fi
    echo "Please install dependencies manually."
    echo "See: https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux"
fi

echo "Dependency installation complete."
