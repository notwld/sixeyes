import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, colors } from '@mui/material';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('username') || !localStorage.getItem('password')) {
      localStorage.setItem('username', 'admin');
      localStorage.setItem('password', 'admin');
    }
  }, []);

  const handleLogin = () => {
    if (username.length < 3 || password.length < 3) {
      setError('Username and password must be at least 3 characters long.');
      return;
    }

    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');

    if (username === storedUsername && password === storedPassword) {
      localStorage.setItem('isUserLoggedIn', 'true');
      window.location.href = '/dashboard'; 
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bgcolor={colors.grey[900]}
      px={3}
    >
      <Typography variant="h1" color={colors.grey[50]} gutterBottom>
        SixEyes
      </Typography>
      <Typography variant="h7" color={colors.grey[300]} mb={4}>
        Connect and Manage All Your Virtual Machines in One Place
      </Typography>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{
          maxWidth: 400,
          bgcolor: colors.grey[800],
          input: { color: colors.grey[50] },
          label: { color: colors.grey[400] },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: colors.grey[700],
            },
            '&:hover fieldset': {
              borderColor: colors.grey[500],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.blue[500],
            },
          },
        }}
      />
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{
          maxWidth: 400,
          bgcolor: colors.grey[800],
          input: { color: colors.grey[50] },
          label: { color: colors.grey[400] },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: colors.grey[700],
            },
            '&:hover fieldset': {
              borderColor: colors.grey[500],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.blue[500],
            },
          },
        }}
      />
      {error && (
        <Typography color="error" variant="body2" mt={2}>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3, maxWidth: 400 }}
        onClick={handleLogin}
      >
        Get Started
      </Button>
    </Box>
  );
}
