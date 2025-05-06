#!/bin/bash

# SixEyes - Single startup script for all components
# This script can start the master server, agent server, or both

# Default settings
MODE="all"         # Can be "master", "agent", "client" or "all"
MASTER_IP="192.168.100.4"
MASTER_PORT=5000
AGENT_NAME="wld"
MASTER_DIR="./master"
AGENT_DIR="./agent"
CLIENT_DIR="./client"
LOG_DIR="./logs"
CLIENT_PORT=5173

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show script usage
show_help() {
    echo -e "${BLUE}SixEyes - Monitoring System${NC}"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --mode MODE         Startup mode: 'master', 'agent', 'client', or 'all' (default: all)"
    echo "  --master-ip IP      IP address for the master server (default: 0.0.0.0)"
    echo "  --master-port PORT  Port for the master server (default: 5000)"
    echo "  --client-port PORT  Port for the client application (default: 3006)"
    echo "  --agent-name NAME   Name for this agent (default: LocalAgent)"
    echo "  --agent-ip IP       IP address of the master when running in agent mode"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  Start everything on one machine:   $0"
    echo "  Start only the master server:      $0 --mode master"
    echo "  Start only an agent:               $0 --mode agent --agent-ip 192.168.1.100"
    echo "  Start only the client:             $0 --mode client"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --master-ip)
      MASTER_IP="$2"
      shift 2
      ;;
    --master-port)
      MASTER_PORT="$2"
      shift 2
      ;;
    --client-port)
      CLIENT_PORT="$2"
      shift 2
      ;;
    --agent-name)
      AGENT_NAME="$2"
      shift 2
      ;;
    --agent-ip)
      AGENT_MASTER_IP="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Validate mode
if [[ ! "$MODE" =~ ^(all|master|agent|client)$ ]]; then
    echo -e "${RED}Error: Mode must be 'all', 'master', 'agent', or 'client'${NC}"
    exit 1
fi

# If in agent mode, agent-ip is required
if [[ "$MODE" == "agent" && -z "$AGENT_MASTER_IP" ]]; then
    echo -e "${RED}Error: --agent-ip is required in agent mode${NC}"
    show_help
    exit 1
fi

# Set AGENT_MASTER_IP to MASTER_IP if in "all" mode and not provided
if [[ "$MODE" == "all" && -z "$AGENT_MASTER_IP" ]]; then
    AGENT_MASTER_IP="127.0.0.1"
fi

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Python 3 is required but not installed. Aborting.${NC}"; exit 1; }
    command -v pip3 >/dev/null 2>&1 || { echo -e "${RED}pip3 is required but not installed. Aborting.${NC}"; exit 1; }
    
    if [[ "$MODE" == "client" || "$MODE" == "all" ]]; then
        command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required for client but not installed. Aborting.${NC}"; exit 1; }
        command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required for client but not installed. Aborting.${NC}"; exit 1; }
    fi
}

# Install required packages
install_packages() {
    echo -e "${BLUE}Installing required packages...${NC}"
    
    if [[ "$MODE" == "master" || "$MODE" == "agent" || "$MODE" == "all" ]]; then
        pip3 install -q flask flask-socketio flask-cors psutil requests websockets python-socketio --break-system-packages
    fi
    
    if [[ "$MODE" == "client" || "$MODE" == "all" ]]; then
        echo -e "${BLUE}Checking for client dependencies...${NC}"
        if [ ! -d "$CLIENT_DIR/node_modules" ]; then
            echo -e "${BLUE}Installing client dependencies (this may take a moment)...${NC}"
            (cd "$CLIENT_DIR" && npm install --silent)
        fi
    fi
}

# Create log directory if it doesn't exist
create_log_dir() {
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}Created log directory: $LOG_DIR${NC}"
}

# Start the master server
start_master() {
    echo -e "${BLUE}Starting master server on $MASTER_IP:$MASTER_PORT...${NC}"
    cd "$MASTER_DIR" || { echo -e "${RED}Master directory not found: $MASTER_DIR${NC}"; exit 1; }
    python3 main.py > "../$LOG_DIR/master.log" 2>&1 &
    MASTER_PID=$!
    echo -e "${GREEN}Master server started with PID: $MASTER_PID${NC}"
    echo -e "${GREEN}Master server running at http://$MASTER_IP:$MASTER_PORT${NC}"
    cd ..
}

# Start the agent server
start_agent() {
    echo -e "${BLUE}Starting agent components...${NC}"
    cd "$AGENT_DIR" || { echo -e "${RED}Agent directory not found: $AGENT_DIR${NC}"; exit 1; }
    
    # Start terminal WebSocket server
    echo -e "${BLUE}Starting terminal WebSocket server...${NC}"
    python3 terminal_server.py --host 0.0.0.0 --port 3001 > "../$LOG_DIR/terminal.log" 2>&1 &
    TERMINAL_PID=$!
    echo -e "${GREEN}Terminal WebSocket server started with PID: $TERMINAL_PID${NC}"
    
    # Start agent server
    echo -e "${BLUE}Starting agent server with name '$AGENT_NAME', connecting to master at $AGENT_MASTER_IP:$MASTER_PORT...${NC}"
    python3 main.py -i "$AGENT_MASTER_IP" -p "$MASTER_PORT" -name "$AGENT_NAME" > "../$LOG_DIR/agent.log" 2>&1 &
    AGENT_PID=$!
    echo -e "${GREEN}Agent server started with PID: $AGENT_PID${NC}"
    
    echo -e "${GREEN}Agent services running:${NC}"
    echo -e "${GREEN}- Agent API server: http://0.0.0.0:3000${NC}"
    echo -e "${GREEN}- Terminal server: ws://0.0.0.0:3001${NC}"
    cd ..
}

# Start the client application
start_client() {
    echo -e "${BLUE}Starting client application on port $CLIENT_PORT...${NC}"
    cd "$CLIENT_DIR" || { echo -e "${RED}Client directory not found: $CLIENT_DIR${NC}"; exit 1; }
    
    # Create or update .env file with configuration
    echo -e "${BLUE}Configuring client environment...${NC}"
    cat > .env <<EOF
PORT=$CLIENT_PORT
REACT_APP_MASTER_URL=http://$MASTER_IP:$MASTER_PORT
EOF
    
    # Start the client in development mode
    echo -e "${BLUE}Starting client in development mode...${NC}"
    pnpm run dev > "../$LOG_DIR/client.log" 2>&1 &
    CLIENT_PID=$!
    echo -e "${GREEN}Client application started with PID: $CLIENT_PID${NC}"
    echo -e "${GREEN}Client available at http://localhost:$CLIENT_PORT${NC}"
    cd ..
}

# Handle cleanup on exit
cleanup() {
    echo -e "${YELLOW}Stopping services...${NC}"
    
    if [[ -n $MASTER_PID ]]; then
        echo -e "${YELLOW}Stopping master server (PID: $MASTER_PID)...${NC}"
        kill $MASTER_PID 2>/dev/null
    fi
    
    if [[ -n $AGENT_PID ]]; then
        echo -e "${YELLOW}Stopping agent server (PID: $AGENT_PID)...${NC}"
        kill $AGENT_PID 2>/dev/null
    fi
    
    if [[ -n $TERMINAL_PID ]]; then
        echo -e "${YELLOW}Stopping terminal server (PID: $TERMINAL_PID)...${NC}"
        kill $TERMINAL_PID 2>/dev/null
    fi
    
    if [[ -n $CLIENT_PID ]]; then
        echo -e "${YELLOW}Stopping client application (PID: $CLIENT_PID)...${NC}"
        kill $CLIENT_PID 2>/dev/null
    fi
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
echo -e "${BLUE}==== SixEyes Startup ====${NC}"
echo -e "${BLUE}Mode: $MODE${NC}"

check_dependencies
install_packages
create_log_dir

# Start services based on mode
if [[ "$MODE" == "master" || "$MODE" == "all" ]]; then
    start_master
fi

if [[ "$MODE" == "agent" || "$MODE" == "all" ]]; then
    start_agent
fi

if [[ "$MODE" == "client" || "$MODE" == "all" ]]; then
    start_client
fi

echo -e "${GREEN}All requested services started!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait indefinitely
wait 