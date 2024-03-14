import './index.css' // Needs to be at the top of the file

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { HashRouter, Route, Routes } from 'react-router-dom'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Config from './config.jsx'
import Graphs from './graphs.jsx'
import Params from './params.jsx'
import FLA from './fla.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <MantineProvider defaultColorScheme='dark'>
    <Notifications />
    <HashRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/graphs' element={<Graphs />} />
        <Route path='/params' element={<Params />} />
        <Route path='/config' element={<Config />} />
        <Route path='/fla' element={<FLA />} />
      </Routes>
    </HashRouter>
  </MantineProvider>,
  // </React.StrictMode>,
)

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*')

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
