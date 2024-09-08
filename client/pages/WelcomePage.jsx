import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { PanoramaFishEye, RemoveRedEye } from '@mui/icons-material';

const WelcomePage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bgcolor="background.default"
      px={3}
    >
      <Typography variant="h1" color="text.primary" gutterBottom>
        Welcome to sixeyes.
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4} textAlign={"center"}>
        Connect and manage all your virtual machines in one place.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          window.location.href = '/agent/add';
        }}
      >
        Get Started
      </Button>
    </Box>
  );
};

export default WelcomePage;
