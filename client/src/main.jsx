import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import FileManager from '../pages/FileManager.jsx'
import Home from '../pages/Home.jsx'
import MainDashboard from '../pages/MainDashboard.jsx'
import WelcomePage from '../pages/WelcomePage.jsx'
import AgentWizard from '../pages/AgentWizard.jsx'
const routes = createBrowserRouter([{
  path: '/',
  element: <App />,
  children: [
    {path: '/', element: <WelcomePage />},
    { path: '/filemanager', element: <FileManager /> },
    { path: "/home", element: <Home /> },
    { path: "/dashboard", element: <WelcomePage /> },
    { path: "/dashboard/:instanceName", element: <MainDashboard /> },
    { path: "/agent/add", element: <AgentWizard /> },


  ],
}])
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={routes} />
  </React.StrictMode>,
)
