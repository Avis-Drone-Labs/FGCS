import "./css/index.css" // Needs to be at the top of the file
import "./css/resizable.css"

// Style imports
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"

// React imports
import { HashRouter, Route, Routes } from "react-router-dom"
import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"

// Mantine imports
import { MantineProvider } from "@mantine/core"

// Route imports
import Config from "./config.jsx"
import Dashboard from "./dashboard.jsx"
import FLA from "./fla.jsx"
import Graphs from "./graphs.jsx"
import Params from "./params.jsx"

// Provider Imports
import { store } from "./redux/store"

// Component imports
import { CustomMantineTheme } from "./components/customMantineTheme.jsx"
import SingleRunWrapper from "./components/SingleRunWrapper.jsx"
import Toolbar from "./components/toolbar/toolbar.jsx"
import { ErrorBoundary } from "./components/error/errorBoundary"
import { SettingsProvider } from "./helpers/settingsProvider.jsx"
import SettingsModal from "./components/settingsModal"
import { Commands } from "./components/spotlight/commandHandler.js"

ReactDOM.createRoot(document.getElementById("root")).render(
  // <MantineProvider defaultColorScheme='dark'>
  <MantineProvider defaultColorScheme="dark" theme={CustomMantineTheme}>
    <HashRouter>
      <SettingsProvider>
        <SingleRunWrapper>
          <Toolbar />
          <ErrorBoundary>
            <SettingsModal />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/graphs" element={<Graphs />} />
              <Route path="/params" element={<Params />} />
              <Route path="/config" element={<Config />} />
              <Route
                path="/fla"
                element={
                  <Provider store={store}>
                    <FLA />
                  </Provider>
                }
              />
            </Routes>
            <Commands />
          </ErrorBoundary>
        </SingleRunWrapper>
      </SettingsProvider>
    </HashRouter>
  </MantineProvider>,
)

// Remove Preload scripts loading
postMessage({ payload: "removeLoading" }, "*")

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message)
})
