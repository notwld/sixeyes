from flask import Flask, jsonify, request, send_from_directory
import os
import platform
import psutil
import requests
import subprocess
import shlex
from datetime import datetime, timedelta
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from socketio import AsyncClient
import asyncio
import threading
import argparse
import logging
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from urllib.parse import unquote

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

parser = argparse.ArgumentParser(description="Agent server for remote file management and system information")
parser.add_argument('-i', '--ip', type=str, help='Master server IP address')
parser.add_argument('-p', '--port', type=int, help='Master server port number')
parser.add_argument('-name', '--name', type=str, help='Agent name')

args = parser.parse_args()

ip_address = args.ip
port_number = args.port
agent_name = args.name

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
sio = AsyncClient()

BASE_DIR = f'/home/{os.getlogin()}'

# Caching variables
cached_public_ip = None
last_ip_fetch_time = None
IP_CACHE_DURATION = timedelta(minutes=1)  

def list_files(directory):
    try:
        files = []
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                files.append({'name': filename, 'type': 'file'})
            elif os.path.isdir(file_path):
                files.append({'name': filename + '/', 'type': 'directory'})
        return files
    except PermissionError:
        logger.error(f"Permission denied accessing directory: {directory}")
        raise Forbidden(f"Permission denied for {directory}")
    except FileNotFoundError:
        logger.error(f"Directory not found: {directory}")
        raise NotFound(f"Directory not found: {directory}")
    except Exception as e:
        logger.error(f"Error listing files in {directory}: {str(e)}")
        raise BadRequest(f"Error listing files: {str(e)}")

def get_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except PermissionError:
        logger.error(f"Permission denied accessing file: {file_path}")
        raise Forbidden(f"Permission denied for {file_path}")
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise NotFound(f"File not found: {file_path}")
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        raise BadRequest(f"Error reading file: {str(e)}")

def safe_join_path(base, *paths):
    """Safely join paths, preventing directory traversal attacks"""
    joined_path = os.path.normpath(os.path.join(base, *paths))
    if not joined_path.startswith(base):
        logger.warning(f"Attempted directory traversal: {paths}")
        raise Forbidden("Path traversal attempt detected")
    return joined_path

@app.route('/')
def file_explorer():
    try:
        path = request.args.get('path', '')
        full_path = safe_join_path(BASE_DIR, path)

        if not os.path.exists(full_path):
            return jsonify({'error': f'Path does not exist: {path}'}), 404

        files = list_files(full_path)
        return jsonify({'files': files, 'current_path': path})
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error in file_explorer: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        path = request.form['path']
        upload_dir = safe_join_path(BASE_DIR, path)

        if not os.path.exists(upload_dir):
            return jsonify({'error': f'Directory does not exist: {path}'}), 404

        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '':
                filename = safe_join_path(upload_dir, file.filename)
                file.save(filename)
                return jsonify({'message': 'File uploaded successfully'}), 200

        return jsonify({'error': 'No file uploaded'}), 400
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/delete', methods=['POST'])
def delete_file():
    try:
        data = request.get_json()
        path = data.get('path', '')
        filename = data.get('filename', '')
        file_path = safe_join_path(BASE_DIR, path, filename)

        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                os.rmdir(file_path)
            else:
                os.remove(file_path)
            return jsonify({'message': 'File deleted successfully'}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except OSError as e:
        logger.error(f"OS error in delete_file: {str(e)}")
        # Check if directory is not empty
        if "Directory not empty" in str(e):
            return jsonify({'error': 'Directory is not empty'}), 400
        return jsonify({'error': f'OS error: {str(e)}'}), 500
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        logger.error(f"Error in delete_file: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/rename', methods=['POST'])
def rename_file():
    try:
        data = request.get_json()
        path = data.get('path', '')
        old_name = data.get('old_name', '')
        new_name = data.get('new_name', '')

        if not old_name or not new_name:
            return jsonify({'error': 'Old name and new name are required'}), 400

        old_path = safe_join_path(BASE_DIR, path, old_name)
        new_path = safe_join_path(BASE_DIR, path, new_name)

        if os.path.exists(old_path):
            os.rename(old_path, new_path)
            return jsonify({'message': 'File renamed successfully'}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except FileExistsError:
        return jsonify({'error': 'A file with the new name already exists'}), 400
    except Exception as e:
        logger.error(f"Error in rename_file: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/create_file', methods=['POST'])
def create_file():
    try:
        data = request.get_json()
        path = data.get('path', '')
        file_name = data.get('file_name', '')
        file_content = data.get('file_content', '')
        
        if not file_name:
            return jsonify({'error': 'File name is required'}), 400
            
        file_path = safe_join_path(BASE_DIR, path, file_name)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        return jsonify({'message': 'File created successfully'}), 200
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except PermissionError:
        return jsonify({'error': 'Permission denied'}), 403
    except Exception as e:
        logger.error(f"Error in create_file: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/get_content', methods=['POST'])
def get_file_content_api():
    try:
        data = request.get_json()
        path = data.get('path', '')
        filename = data.get('filename', '')
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
            
        file_path = safe_join_path(BASE_DIR, path, filename)

        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                return jsonify({'error': 'Cannot read content of a directory'}), 400
                
            content = get_file_content(file_path)
            return jsonify({'content': content}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_file_content_api: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/download/<path:file_path>', methods=['GET'])
def download_file(file_path):
    try:
        decoded_file_path = unquote(file_path)
        absolute_file_path = safe_join_path(BASE_DIR, decoded_file_path)

        if not os.path.isfile(absolute_file_path):
            return jsonify({'error': 'File not found or invalid path'}), 404

        return send_from_directory(os.path.dirname(absolute_file_path), 
                                   os.path.basename(absolute_file_path), 
                                   as_attachment=True)
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        logger.error(f"Error in download_file: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Terminal command execution endpoint
@app.route('/execute-command', methods=['POST'])
def execute_command():
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({'error': 'Command is required'}), 400
        
        # Whitelist of allowed commands or implement other security measures
        # This is a simple example, in production you would want more robust security
        blocked_commands = ['rm -rf', 'mkfs', 'dd', 'format']
        if any(cmd in command.lower() for cmd in blocked_commands):
            return jsonify({'error': 'Command not allowed for security reasons'}), 403
        
        # Execute the command
        process = subprocess.Popen(
            command, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(timeout=30)  # 30 second timeout
        
        if process.returncode != 0:
            return jsonify({'output': stderr, 'error': True}), 200
        
        return jsonify({'output': stdout}), 200
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Command timed out'}), 408
    except Exception as e:
        logger.error(f"Error executing command: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def get_public_ip():
    global cached_public_ip, last_ip_fetch_time

    current_time = datetime.now()

    if cached_public_ip is None or last_ip_fetch_time is None or (current_time - last_ip_fetch_time) > IP_CACHE_DURATION:
        try:
            response = requests.get('https://ipinfo.io/ip', timeout=5)
            cached_public_ip = response.text.strip()
            last_ip_fetch_time = current_time
        except requests.RequestException as e:
            logger.error(f"Error getting public IP: {e}")
            return None

    return cached_public_ip

def get_size(bytes, suffix="B"):
    factor = 1024
    for unit in ["", "K", "M", "G", "T", "P"]:
        if bytes < factor:
            return f"{bytes:.2f}{unit}{suffix}"
        bytes /= factor

def get_system_info():
    system_info = {}

    try:
        uname = platform.uname()
        system_info['System'] = uname.system
        system_info['NodeName'] = uname.node
        system_info['Release'] = uname.release
        system_info['Version'] = uname.version
        system_info['Machine'] = uname.machine
        system_info['Processor'] = uname.processor
        
        boot_time_timestamp = psutil.boot_time()
        bt = datetime.fromtimestamp(boot_time_timestamp)
        system_info['BootTime'] = f"{bt.year}/{bt.month}/{bt.day} {bt.hour}:{bt.minute}:{bt.second}"
        
        system_info['PhysicalCores'] = psutil.cpu_count(logical=False)
        system_info['TotalCores'] = psutil.cpu_count(logical=True)
        
        cpufreq = psutil.cpu_freq()
        if cpufreq:
            system_info['MaxFrequency'] = f"{cpufreq.max:.2f}Mhz" if cpufreq.max else "N/A"
            system_info['MinFrequency'] = f"{cpufreq.min:.2f}Mhz" if cpufreq.min else "N/A"
            system_info['CurrentFrequency'] = f"{cpufreq.current:.2f}Mhz" if cpufreq.current else "N/A"
        else:
            system_info['MaxFrequency'] = "N/A"
            system_info['MinFrequency'] = "N/A"
            system_info['CurrentFrequency'] = "N/A"
        
        system_info['TotalCPUUsage'] = f"{psutil.cpu_percent(interval=1)}%"  
        
        memory_info = {}
        svmem = psutil.virtual_memory()
        memory_info['Total'] = get_size(svmem.total)
        memory_info['Available'] = get_size(svmem.available)
        memory_info['Used'] = get_size(svmem.used)
        memory_info['Percentage'] = f"{svmem.percent}%"
        system_info['MemoryInformation'] = memory_info
        
        swap_info = {}
        swap = psutil.swap_memory()
        swap_info['Total'] = get_size(swap.total)
        swap_info['Free'] = get_size(swap.free)
        swap_info['Used'] = get_size(swap.used)
        swap_info['Percentage'] = f"{swap.percent}%"
        system_info['Swap'] = swap_info

        system_info['PublicIP'] = get_public_ip()
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        system_info['Error'] = str(e)

    return system_info

@app.route('/system_info', methods=['GET'])
def system_info():
    return jsonify(get_system_info())

# Terminal WebSocket handling
@socketio.on('connect', namespace='/terminal')
def terminal_connect():
    logger.info('Client connected to terminal')

@socketio.on('disconnect', namespace='/terminal')
def terminal_disconnect():
    logger.info('Client disconnected from terminal')

@socketio.on('command', namespace='/terminal')
def handle_terminal_command(data):
    try:
        command = data.get('command', '')
        if not command:
            emit('output', {'output': 'Error: No command provided', 'error': True})
            return
            
        # Security checks
        blocked_commands = ['rm -rf', 'mkfs', 'dd', 'format']
        if any(cmd in command.lower() for cmd in blocked_commands):
            emit('output', {'output': 'Error: Command not allowed for security reasons', 'error': True})
            return
            
        # Execute command
        process = subprocess.Popen(
            command, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(timeout=30)
        
        if process.returncode != 0:
            emit('output', {'output': stderr, 'error': True})
        else:
            emit('output', {'output': stdout})
    except subprocess.TimeoutExpired:
        emit('output', {'output': 'Command execution timed out', 'error': True})
    except Exception as e:
        logger.error(f"Error executing terminal command: {str(e)}")
        emit('output', {'output': f'Error: {str(e)}', 'error': True})

@sio.event
async def connect():
    logger.info("Connected to the master server")
    await sio.emit('get_system_info_from_agent', {
        "public_ip": get_public_ip(),
        "name": agent_name
    })

@sio.event
async def disconnect():
    logger.info("Disconnected from the master server")
    await sio.emit('agent_disconnected', {
        "public_ip": get_public_ip(),
        "name": agent_name
    })

async def start_socketio_client():
    try:
        await sio.connect(f'http://{ip_address}:{port_number}')
        await sio.wait()  # connection is alive 
    except Exception as e:
        logger.error(f"Failed to connect to master server: {e}")

def run_socketio_client():
    asyncio.run(start_socketio_client())

# Heartbeat to maintain agent connection
async def heartbeat():
    while True:
        try:
            if sio.connected:
                await sio.emit('agent_heartbeat', {
                    "public_ip": get_public_ip(),
                    "name": agent_name,
                    "timestamp": datetime.now().isoformat()
                })
            await asyncio.sleep(30)  # Send heartbeat every 30 seconds
        except Exception as e:
            logger.error(f"Error in heartbeat: {e}")
            await asyncio.sleep(5)  # Wait a bit before trying again

def run_heartbeat():
    asyncio.run(heartbeat())

if __name__ == '__main__':
    # Start client connection to master server
    client_thread = threading.Thread(target=run_socketio_client)
    client_thread.daemon = True 
    client_thread.start()
    
    # Start heartbeat thread
    heartbeat_thread = threading.Thread(target=run_heartbeat)
    heartbeat_thread.daemon = True
    heartbeat_thread.start()

    # Start the Flask application
    socketio.run(app, debug=True, host="0.0.0.0", port=3000)