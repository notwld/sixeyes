import { io } from 'socket.io-client';

const socket = io('http://192.168.1.106:5000', {
    transports: ['websocket'],
});

socket.on('connect', () => {
    console.log('Connected to server');
});

export default socket;
