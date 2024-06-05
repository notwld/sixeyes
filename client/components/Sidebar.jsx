import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Switch, FormControlLabel } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';

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
  const [value, setValue] = React.useState(0);

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
          <Tab label="" />
          <Tab label="Instances" />
        </Tabs>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <TabPanel value={value} index={0}>
            <List component="nav">
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
          </TabPanel>
          <TabPanel value={value} index={1}>
            <List component="nav">
              <ListItem button to="/aws">
                <ListItemIcon>
                  <CloudIcon />
                </ListItemIcon>
                <ListItemText primary="AWS" />
              </ListItem>
              <ListItem button to="/linode">
                <ListItemIcon>
                <CloudIcon />
                </ListItemIcon>
                <ListItemText primary="Linode" />
              </ListItem>
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
