import './index.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { HashRouter, Route, Routes } from 'react-router-dom'

import AllData from './allData.jsx'
import App from './App.jsx'
import Graphs from './graphs.jsx'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import Params from './params.jsx'
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <MantineProvider defaultColorScheme='dark'>
    <Notifications />
    <HashRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/graphs' element={<Graphs />} />
        <Route path='/params' element={<Params />} />
        <Route path='/all-data' element={<AllData />} />
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
