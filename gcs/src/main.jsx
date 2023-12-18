import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Graphs from './graphs.jsx'
import Config from './config.jsx'
import AllData from './allData.jsx'
import { HashRouter, Route, Routes } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/graphs" element={<Graphs />} />
      <Route path="/config" element={<Config />} />
      <Route path="/all-data" element={<AllData />} />
    </Routes>
  </HashRouter>,
  // </React.StrictMode>,
)

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*')

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
