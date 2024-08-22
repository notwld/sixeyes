import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Switch, FormControlLabel, Button, Typography } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import { AddAPhoto, AddIcCallOutlined, PanTool, ToggleOn } from '@mui/icons-material';

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
  const [value, setValue] = React.useState(1);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const [instances, setInstances] = React.useState([]);
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
          <Tab label="" disabled={!instances?.length > 0}/>
          <Tab label="Instances" />
        </Tabs>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {instances?.length > 0 && <TabPanel value={value} index={0}>
            <List component="nav">
            <ListItem sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}>
                  
                  <Button
                    variant="contained"
                    onClick={() => {
                      window.location.href = '/agent/add';

                    }}
                  >
                    + Add New
                  </Button>
                </ListItem>
              <ListItem button to="/terminal">
                <ListItemIcon>
                  <TerminalIcon />
                </ListItemIcon>
                <ListItemText primary="Terminal" />
              </ListItem>
              <ListItem button to="/file-manager">
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary="File Manager" />
              </ListItem>
              <ListItem button to="/services">
                <ListItemIcon>
                  <BuildIcon />
                </ListItemIcon>
                <ListItemText primary="Services" />
              </ListItem>
              <ListItem button to="/ports">
                <ListItemIcon>
                  <DnsIcon />
                </ListItemIcon>
                <ListItemText primary="Ports" />
              </ListItem>
            </List>
          </TabPanel>}
          <TabPanel value={value} index={1}>
            <List component="nav">
              {instances?.length > 0 ? instances?.map((instance) => {
                return (
                  <ListItem key={instance.id} button>
                    <ListItemIcon>
                      <CloudIcon />
                    </ListItemIcon>
                    <ListItemText primary={instance.name} />
                  </ListItem>
                );
              }) : (
                <ListItem sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}>
                  <Typography variant="h7" textAlign="center" color="textSecondary" py={3}>
                    No instances found
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      window.location.href = '/agent/add';

                    }}
                  >
                    + Add New
                  </Button>
                </ListItem>
              )}
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
