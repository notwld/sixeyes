import asyncio
import websockets
import json
import subprocess
import shlex
import logging
import argparse
import os
import signal
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('terminal_server.log')
    ]
)
logger = logging.getLogger(__name__)

# Command whitelist/blacklist for security
BLOCKED_COMMANDS = ['rm -rf', 'mkfs', 'dd', 'format', 'shutdown', 'reboot', ':(){', 'sudo rm']
MAX_OUTPUT_SIZE = 1024 * 100  # 100KB limit for output

async def execute_command(command):
    """Execute a shell command and return the output"""
    try:
        # Security check
        if any(blocked in command.lower() for blocked in BLOCKED_COMMANDS):
            return {'output': 'Command not allowed for security reasons', 'error': True}
            
        # Execute the command with timeout
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            shell=True
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30)
            
            stdout_str = stdout.decode('utf-8', errors='replace')
            stderr_str = stderr.decode('utf-8', errors='replace')
            
            # Limit output size
            if len(stdout_str) > MAX_OUTPUT_SIZE:
                stdout_str = stdout_str[:MAX_OUTPUT_SIZE] + "\n... (output truncated)"
            if len(stderr_str) > MAX_OUTPUT_SIZE:
                stderr_str = stderr_str[:MAX_OUTPUT_SIZE] + "\n... (output truncated)"
            
            if process.returncode != 0:
                return {'output': stderr_str or 'Command failed with no output', 'error': True}
            else:
                return {'output': stdout_str or 'Command executed successfully (no output)'}
                
        except asyncio.TimeoutError:
            # Kill the process if it times out
            try:
                process.kill()
            except:
                pass
            return {'output': 'Command execution timed out after 30 seconds', 'error': True}
            
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        return {'output': f'Error: {str(e)}', 'error': True}

async def terminal_handler(websocket, path=None):
    """Handle WebSocket connections for terminal commands"""
    client_ip = websocket.remote_address[0]
    logger.info(f"Terminal connection established from {client_ip}")
    
    try:
        # Send welcome message
        await websocket.send(json.dumps({
            'output': f'Connected to terminal service on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\nType commands to execute them on the server.',
            'type': 'system'
        }))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                command = data.get('command', '').strip()
                
                if not command:
                    await websocket.send(json.dumps({
                        'output': 'Please enter a command',
                        'error': True
                    }))
                    continue
                    
                logger.info(f"Executing command from {client_ip}: {command}")
                result = await execute_command(command)
                await websocket.send(json.dumps(result))
                
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    'output': 'Invalid message format. Expected JSON.',
                    'error': True
                }))
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send(json.dumps({
                    'output': f'Server error: {str(e)}',
                    'error': True
                }))
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Terminal connection closed from {client_ip}")
    except Exception as e:
        logger.error(f"Unexpected error in terminal handler: {e}")

async def start_server(host, port):
    """Start the WebSocket server"""
    server = await websockets.serve(
        terminal_handler, 
        host, 
        port,
        ping_interval=30,
        ping_timeout=10
    )
    
    logger.info(f"Terminal WebSocket server started on {host}:{port}")
    
    return server

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebSocket Terminal Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=3001, help="Port to bind to")
    
    args = parser.parse_args()
    
    # Handle graceful shutdown
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    def signal_handler():
        logger.info("Shutting down terminal server...")
        loop.stop()
    
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)
    
    try:
        loop.run_until_complete(start_server(args.host, args.port))
        loop.run_forever()
    except KeyboardInterrupt:
        logger.info("Terminal server stopped by user")
    except Exception as e:
        logger.error(f"Error starting terminal server: {e}")
    finally:
        loop.close()
        logger.info("Terminal server shutdown complete") 