import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import ReactSpeedometer from 'react-d3-speedometer';
import InfoComponent from '../components/InfoComponent';
import DialCard from '../components/DialCard';

const MainDashboard = () => {
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:5000/system_info'); // Replace with your actual API endpoint
      const data = await response.json();
      setSystemInfo(data);
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (!systemInfo) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
     <Grid container spacing={3} justifyContent="center">
        <Grid item>
          <DialCard title="CPU Usage" usage={parseFloat(systemInfo.TotalCPUUsage)} />
        </Grid>
        <Grid item>
          <DialCard title="Memory Usage" usage={parseFloat(systemInfo.MemoryInformation.Percentage)} />
        </Grid>
        <Grid item>
          <DialCard title="Swap Usage" usage={parseFloat(systemInfo.Swap.Percentage)} />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <InfoComponent systemInfo={systemInfo} />
      </Box>
    </Box>
  );
};

export default MainDashboard;
