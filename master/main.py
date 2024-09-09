from flask import Flask, jsonify
from flask_socketio import SocketIO, send, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

connected_agents = []

@socketio.on('connect')
def handle_connect():
    print("Client connected.")

@socketio.on('disconnect')
def handle_disconnect(data):
    print("Client disconnected.")

@socketio.on('get_system_info_from_agent')
def handle_system_info(data):
    print("Received system info:", data)
    if not any(agent['agentIp'] == data['public_ip'] for agent in connected_agents):
        connected_agents.append({
            "agentIp": data['public_ip'],
            "agentName": data['name']
        })
@socketio.on('agent_disconnected')
def handle_agent_disconnected(data):
    print(f"Agent disconnecting: {data}")
    connected_agents[:] = [agent for agent in connected_agents if agent['agentIp'] != data['public_ip']]

@app.route('/agents', methods=['GET'])
def get_agents():
    return jsonify(connected_agents)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
