import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Switch, FormControlLabel, Button, Typography, colors, rgbToHex } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const Sidebar = ({ darkMode, setDarkMode }) => {
  const [value, setValue] = useState(1);
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://192.168.1.106:5000/agents`);
        const data = await response.json();
        setInstances(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000); // Fetch data every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }} my={2}>
      <Box sx={{ width: 250, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Sidebar Tabs"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="" disabled={!instances?.length} />
          <Tab label="Instances" />
        </Tabs>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <TabPanel value={value} index={1}>
            <List component="nav" sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}>
              
              {instances.length > 0 ? instances.map((instance, index) => (
                <ListItem key={index} button style={{
                  backgroundColor: instance.agentIp===window.location.pathname.split("/")[2] ? "#c6e7ed80" : 'inherit',
                  borderRadius:instance.agentIp===window.location.pathname.split("/")[2] ? "10px" : 'inherit',
                }}>
                  <ListItemIcon>
                    <CloudIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={instance.agentName}
                    
                    onClick={() => {
                      window.location.href = `/dashboard/${instance.agentIp}`;
                    }}
                  />

                </ListItem>
              )) : (
                <ListItem sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}>
                  <Typography variant="h7" textAlign="center" color="textSecondary" py={3}>
                    No VM connected
                  </Typography>
                 
                </ListItem>
              )}
               <Button
                    variant="contained"
                    sx={{
                      marginTop:"25px"
                    }}
                    onClick={() => {
                      window.location.href = '/agent/add';
                    }}
                  >
                    + Add New
                  </Button>
            </List>
          </TabPanel>
        </Box>
        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                name="darkModeToggle"
                color="primary"
              />
            }
            label="Dark Mode"
          />
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;
