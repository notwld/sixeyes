import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import DialCard from '../components/DialCard';
import InfoComponent from '../components/InfoComponent';
import Terminal from '../components/Terminal';
import FileManager from './FileManager';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const MainDashboard = () => {
  const { instanceName } = useParams();
  const location = useLocation();
  const agentIp = location.pathname.split("/")[2];
  const [systemInfo, setSystemInfo] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://${agentIp}:3000/system_info`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSystemInfo(data);
      } catch (error) {
        console.error("Error fetching system info:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, [agentIp]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (!systemInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading system information...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, borderRadius: 2 }}>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="dashboard tabs"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
          }}
        >
          <Tab label="Dashboard" {...a11yProps(0)} />
          <Tab label="Terminal" {...a11yProps(1)} />
          <Tab label="File Manager" {...a11yProps(2)} />
        </Tabs>
        
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3} justifyContent="center" >
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
          <Box sx={{ mt: 3, borderRadius: 2 }}>
            <InfoComponent systemInfo={systemInfo} />
          </Box>
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          <Terminal />
        </TabPanel>
        
        <TabPanel value={currentTab} index={2}>
          <FileManager agentIp={agentIp} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MainDashboard;
