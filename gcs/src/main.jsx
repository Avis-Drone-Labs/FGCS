import './css/index.css' // Needs to be at the top of the file
import './css/resizable.css'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { HashRouter, Route, Routes } from 'react-router-dom'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import SingleRunWrapper from './components/SingleRunWrapper.jsx'
import Config from './config.jsx'
import Dashboard from './dashboard.jsx'
import FLA from './fla.jsx'
import Graphs from './graphs.jsx'
import Params from './params.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider defaultColorScheme='dark'>
    <Notifications />
    <HashRouter>
      <SingleRunWrapper>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/graphs' element={<Graphs />} />
          <Route path='/params' element={<Params />} />
          <Route path='/config' element={<Config />} />
          <Route path='/fla' element={<FLA />} />
        </Routes>
      </SingleRunWrapper>
    </HashRouter>
  </MantineProvider>,
)

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*')

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
