#!/bin/bash

# Script to start both the agent server and terminal WebSocket server

# Default values
MASTER_IP="127.0.0.1"
MASTER_PORT=5000
AGENT_NAME="Unknown"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --master-ip)
      MASTER_IP="$2"
      shift 2
      ;;
    --master-port)
      MASTER_PORT="$2"
      shift 2
      ;;
    --name)
      AGENT_NAME="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --master-ip IP      IP address of the master server (default: 127.0.0.1)"
      echo "  --master-port PORT  Port of the master server (default: 5000)"
      echo "  --name NAME         Name of this agent (default: Unknown)"
      echo "  --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check dependencies
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting."; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo "pip3 is required but not installed. Aborting."; exit 1; }

# Install required packages if they're not already installed
pip3 install -q flask flask-socketio flask-cors psutil requests websockets python-socketio

# Start terminal WebSocket server in the background
echo "Starting terminal WebSocket server..."
python3 terminal_server.py --host 0.0.0.0 --port 3001 &
TERMINAL_PID=$!

# Function to handle termination
function cleanup {
  echo "Stopping services..."
  kill $TERMINAL_PID 2>/dev/null
  kill $AGENT_PID 2>/dev/null
  exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Start the agent server
echo "Starting agent server with name '$AGENT_NAME', connecting to master at $MASTER_IP:$MASTER_PORT..."
python3 main.py -i "$MASTER_IP" -p "$MASTER_PORT" -name "$AGENT_NAME" &
AGENT_PID=$!

# Wait for services
echo "Services started:"
echo "- Agent server (PID: $AGENT_PID) at http://0.0.0.0:3000"
echo "- Terminal server (PID: $TERMINAL_PID) at ws://0.0.0.0:3001"
echo "Press Ctrl+C to stop all services"

wait 