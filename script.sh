#!/bin/bash

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect Linux distribution."
    exit 1
fi

# # Update package lists
# echo "Updating package lists..."
# if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
#     sudo apt update
# elif [[ "$OS" == "fedora" ]]; then
#     sudo dnf update
# elif [[ "$OS" == "centos" ]]; then
#     sudo yum update
# elif [[ "$OS" == "arch" ]]; then
#     sudo pacman -Sy
# else
#     echo "Unsupported Linux distribution."
#     exit 1
# fi

echo "Installing Python3, pip, and virtualenv..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    sudo apt install -y python3 python3-pip python3-venv
elif [[ "$OS" == "fedora" ]]; then
    sudo dnf install -y python3 python3-pip python3-virtualenv
elif [[ "$OS" == "centos" ]]; then
    sudo yum install -y python3 python3-pip python3-virtualenv
elif [[ "$OS" == "arch" ]]; then
    sudo pacman -S --noconfirm python python-pip python-virtualenv
fi

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate
curl -O https://raw.githubusercontent.com/notwld/sixeyes/master/agent/requirement.txt > requirements.txt

if [ -f requirements.txt ]; then
    echo "Installing requirements..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found."
    exit 1
fi

if [ -f main.py ]; then
    echo "Running main.py..."
    chmod +x main.py
    python main.py -i $1 -p $2 -name $3
else
    echo "main.py not found."
    exit 1
fi

deactivate
