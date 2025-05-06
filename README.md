# SixEyes - System Monitoring and Management

SixEyes is a web-based monitoring and management system for remote servers. It provides functionality similar to Webmin with a modern interface, allowing you to monitor system resources, manage files, and execute commands remotely.

## Features

- **System Monitoring**: View CPU, memory, swap usage, and other system information
- **Remote Terminal**: SSH-like terminal functionality through a web interface
- **File Manager**: Browse, edit, create, upload, and download files on remote systems
- **Multi-Agent Support**: Manage multiple servers from a single master interface
- **Easy Setup**: Simple installation and deployment process

## Architecture

SixEyes consists of three main components:

1. **Master Server**: Central server that manages connections to agents
2. **Agent**: Runs on each monitored system, providing system information and executing commands
3. **Client**: Web interface for interacting with the system

## Requirements

- Python 3.6+
- Node.js and npm (for client)
- Web browser with WebSocket support
- Internet connection (for package downloads during installation)

## Quick Start

The easiest way to get started is to use the all-in-one startup script:

```bash
# Clone the repository
git clone https://github.com/notwld/sixeyes.git
cd sixeyes

# Make the startup script executable
chmod +x start_sixeyes.sh

# Start all components on the local machine
./start_sixeyes.sh
```

This will start the master server, an agent, and the client web interface on your local machine. You can then access the web interface at http://localhost:3006.

## Installation Options

### Start Everything on One Machine

```bash
./start_sixeyes.sh
```

### Start Only the Master Server

```bash
./start_sixeyes.sh --mode master
```

### Start Only an Agent (connecting to remote master)

```bash
./start_sixeyes.sh --mode agent --agent-ip 192.168.1.100
```

### Start Only the Client Interface

```bash
./start_sixeyes.sh --mode client
```

### All Available Options

```
Usage: ./start_sixeyes.sh [options]

Options:
  --mode MODE         Startup mode: 'master', 'agent', 'client', or 'all' (default: all)
  --master-ip IP      IP address for the master server (default: 0.0.0.0)
  --master-port PORT  Port for the master server (default: 5000)
  --client-port PORT  Port for the client application (default: 3006)
  --agent-name NAME   Name for this agent (default: LocalAgent)
  --agent-ip IP       IP address of the master when running in agent mode
  --help              Show this help message
```

## Distributed Setup Example

For a distributed setup across multiple machines:

1. Start the master server on your main machine:
   ```bash
   ./start_sixeyes.sh --mode master
   ```

2. Start the client interface (can be on same machine as master):
   ```bash
   ./start_sixeyes.sh --mode client --master-ip MASTER_IP_ADDRESS
   ```

3. On each remote machine you want to monitor:
   ```bash
   ./start_sixeyes.sh --mode agent --agent-ip MASTER_IP_ADDRESS --agent-name "Server Name"
   ```

4. Alternatively, use the web interface to set up new agents. Go to the dashboard and click the "Add New" button.

## Log Files

All logs are stored in the `logs` directory:
- `master.log`: Master server logs
- `agent.log`: Agent server logs
- `terminal.log`: Terminal WebSocket server logs
- `client.log`: Client application logs

## Security Considerations

- The system uses HTTP and WebSockets without encryption. For production use, consider adding SSL/TLS.
- Command execution is unrestricted except for a basic blocklist. Be cautious when deploying in untrusted environments.
- For production use, implement proper authentication and authorization mechanisms.

## Development

### Project Structure

- `/master`: Master server code
- `/agent`: Agent server code
- `/client`: Web client interface
- `/logs`: Log files (created when running the system)

### Building the Frontend

```bash
cd client
npm install
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 