import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Sidebar from '../components/Sidebar'
import MainDashboard from '../pages/MainDashboard'

import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';


function App() {
  const [darkMode, setDarkMode] = useState(true);
  const isLoggedIn = localStorage.getItem('isUserLoggedIn');
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex' }}>
        {isLoggedIn && <Sidebar setDarkMode={setDarkMode} darkMode={darkMode} />}
        <div style={{ flexGrow: 1 }}>
        <Outlet />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
