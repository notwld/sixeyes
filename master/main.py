from flask import Flask, jsonify, request
from flask_socketio import SocketIO, send, emit
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import threading
import time

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store connected agents with last heartbeat timestamp
connected_agents = []
agent_heartbeats = {}
HEARTBEAT_TIMEOUT = timedelta(minutes=2)

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")
    # Check if this was an agent disconnecting
    for agent in connected_agents:
        if agent.get('sid') == request.sid:
            logger.info(f"Agent disconnected: {agent['agentName']} ({agent['agentIp']})")
            connected_agents.remove(agent)
            agent_heartbeats.pop(agent['agentIp'], None)
            break

@socketio.on('get_system_info_from_agent')
def handle_system_info(data):
    logger.info(f"Received system info: {data}")
    agent_ip = data.get('public_ip')
    agent_name = data.get('name')
    
    if not agent_ip or not agent_name:
        logger.warning(f"Received incomplete agent data: {data}")
        return
        
    # If agent already exists, update it
    existing_agent = next((agent for agent in connected_agents if agent['agentIp'] == agent_ip), None)
    
    if existing_agent:
        existing_agent['agentName'] = agent_name
        existing_agent['sid'] = request.sid
        existing_agent['lastConnected'] = datetime.now().isoformat()
    else:
        connected_agents.append({
            "agentIp": agent_ip,
            "agentName": agent_name,
            "sid": request.sid,
            "lastConnected": datetime.now().isoformat()
        })
    
    # Update heartbeat timestamp
    agent_heartbeats[agent_ip] = datetime.now()
    
    # Notify all clients about the updated agent list
    socketio.emit('agent_list_updated', connected_agents)

@socketio.on('agent_heartbeat')
def handle_agent_heartbeat(data):
    agent_ip = data.get('public_ip')
    agent_name = data.get('name')
    
    if not agent_ip:
        logger.warning(f"Received incomplete heartbeat data: {data}")
        return
    
    logger.debug(f"Heartbeat from {agent_name} ({agent_ip})")
    
    # Update heartbeat timestamp
    agent_heartbeats[agent_ip] = datetime.now()
    
    # Find and update the agent's last connected time
    for agent in connected_agents:
        if agent['agentIp'] == agent_ip:
            agent['lastConnected'] = datetime.now().isoformat()
            break

@socketio.on('agent_disconnected')
def handle_agent_disconnected(data):
    logger.info(f"Agent disconnecting: {data}")
    agent_ip = data.get('public_ip')
    
    if not agent_ip:
        return
        
    # Remove the agent
    connected_agents[:] = [agent for agent in connected_agents if agent['agentIp'] != agent_ip]
    agent_heartbeats.pop(agent_ip, None)
    
    # Notify all clients about the updated agent list
    socketio.emit('agent_list_updated', connected_agents)

@app.route('/agents', methods=['GET'])
def get_agents():
    return jsonify(connected_agents)

def check_agent_heartbeats():
    """Periodically check for agents that haven't sent a heartbeat recently and mark them as disconnected"""
    while True:
        try:
            current_time = datetime.now()
            disconnected_agents = []
            
            for agent in connected_agents:
                agent_ip = agent['agentIp']
                if agent_ip in agent_heartbeats:
                    last_heartbeat = agent_heartbeats[agent_ip]
                    if current_time - last_heartbeat > HEARTBEAT_TIMEOUT:
                        logger.info(f"Agent timed out: {agent['agentName']} ({agent_ip})")
                        disconnected_agents.append(agent_ip)
                        agent_heartbeats.pop(agent_ip, None)
            
            # Remove disconnected agents
            if disconnected_agents:
                connected_agents[:] = [agent for agent in connected_agents if agent['agentIp'] not in disconnected_agents]
                socketio.emit('agent_list_updated', connected_agents)
                
            time.sleep(30)  # Check every 30 seconds
        except Exception as e:
            logger.error(f"Error in heartbeat checker: {e}")
            time.sleep(5)  # Wait a bit if there was an error

if __name__ == '__main__':
    # Start heartbeat checker thread
    heartbeat_thread = threading.Thread(target=check_agent_heartbeats)
    heartbeat_thread.daemon = True
    heartbeat_thread.start()
    
    socketio.run(app, host='0.0.0.0', port=5000)
