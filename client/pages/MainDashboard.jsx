import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import DialCard from '../components/DialCard';
import InfoComponent from '../components/InfoComponent';

const MainDashboard = () => {
  const { instanceName } = useParams();
  const location = useLocation();
  console.log(location.pathname.split("/")[2]);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`http://192.168.1.108:3000/system_info`);
      const data = await response.json();
      setSystemInfo(data);
    };

    fetchData();
    const intervalId = setInterval(fetchData, 3000);

    return () => clearInterval(intervalId);
  }, [instanceName]);

  if (!systemInfo) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3,borderRadius:12 }}>
      
      <Grid container spacing={3} justifyContent="center" >
        <Grid item sx={
        {
          borderRadius:12
        }
      }>
          <DialCard title="CPU Usage" usage={parseFloat(systemInfo.TotalCPUUsage)} />
        </Grid>
        <Grid item>
          <DialCard title="Memory Usage" usage={parseFloat(systemInfo.MemoryInformation.Percentage)} />
        </Grid>
        <Grid item>
          <DialCard title="Swap Usage" usage={parseFloat(systemInfo.Swap.Percentage)} />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3,borderRadius:12 }}>
        <InfoComponent systemInfo={systemInfo} />
      </Box>
    </Box>
  );
};

export default MainDashboard;
