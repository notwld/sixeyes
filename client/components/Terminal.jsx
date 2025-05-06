import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Paper, Typography, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

const Terminal = () => {
  const { instanceName } = useParams();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const outputEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server for real-time terminal interaction
    let socketUrl = `ws://${instanceName}:3001`;
    console.log(`Connecting to terminal WebSocket at: ${socketUrl}`);
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setOutput(prev => [...prev, { text: 'Connected to terminal service', type: 'system' }]);
    };

    socket.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        setOutput(prev => [...prev, { 
          text: data.output, 
          type: data.error ? 'error' : data.type || 'output'
        }]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setOutput(prev => [...prev, { 
          text: `Error parsing server response: ${event.data}`, 
          type: 'error' 
        }]);
        setIsLoading(false);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setOutput(prev => [...prev, { text: 'Connection error. Please try again.', type: 'error' }]);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setOutput(prev => [...prev, { text: 'Connection closed', type: 'system' }]);
      setIsConnected(false);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [instanceName]);

  // Auto-scroll to bottom of terminal output
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  const executeCommand = async (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to output
    setOutput(prev => [...prev, { text: `$ ${command}`, type: 'command' }]);
    setIsLoading(true);

    // Using the WebSocket connection to send commands
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ command }));
      } catch (error) {
        console.error('Error sending command via WebSocket:', error);
        setOutput(prev => [...prev, { 
          text: `Error sending command: ${error.message}`, 
          type: 'error' 
        }]);
        setIsLoading(false);
      }
    } else {
      // Fallback to HTTP if WebSocket is not available
      try {
        const response = await fetch(`http://${instanceName}:3000/execute-command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
        });
        
        const data = await response.json();
        setOutput(prev => [...prev, { 
          text: data.output, 
          type: data.error ? 'error' : 'output' 
        }]);
      } catch (error) {
        console.error('Error executing command via HTTP:', error);
        setOutput(prev => [...prev, { 
          text: 'Failed to execute command. Server may be unavailable.', 
          type: 'error' 
        }]);
      }
      setIsLoading(false);
    }
    
    setCommand('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="h4" gutterBottom>Terminal</Typography>
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          backgroundColor: '#1e1e1e', 
          color: '#f0f0f0',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '14px',
          mb: 2,
          height: '60vh',
        }}
      >
        {output.map((line, index) => (
          <Box 
            key={index} 
            sx={{ 
              py: 0.5,
              color: line.type === 'error' ? '#ff6b6b' : 
                     line.type === 'command' ? '#61afef' : 
                     line.type === 'system' ? '#98c379' : '#f0f0f0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {line.text}
          </Box>
        ))}
        {isLoading && <Box sx={{ color: '#f0f0f0' }}>Processing...</Box>}
        <div ref={outputEndRef} />
      </Paper>
      
      <Box component="form" onSubmit={executeCommand} sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={isConnected ? "Enter command..." : "Connecting..."}
          disabled={!isConnected || isLoading}
          InputProps={{
            sx: { 
              fontFamily: 'monospace',
              backgroundColor: '#2d2d2d',
              color: '#f0f0f0',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3f3f3f',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5f5f5f',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#007bff',
              },
            }
          }}
          sx={{ mr: 1 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!isConnected || isLoading}
        >
          Execute
        </Button>
      </Box>
    </Box>
  );
};

export default Terminal; 