import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import FileManager from '../pages/FileManager.jsx'
const routes = createBrowserRouter([{
  path: '/',
  element: <App />,
  children: [
    { path: '/filemanager', element: <FileManager /> },

  ],
}])
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={routes} />
  </React.StrictMode>,
)
