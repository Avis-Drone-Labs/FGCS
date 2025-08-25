/*
  The main wrapper for the app
*/

import { Route, Routes } from "react-router-dom"
import { useEffect } from "react"

import Toolbar from "./toolbar/toolbar"
import SettingsModal from "./settingsModal"
import { Commands } from "./spotlight/commandHandler"

// Wrappers
import SingleRunWrapper from "./SingleRunWrapper"
import { SettingsProvider } from "../helpers/settingsProvider"

// Routes
import FLA from "../fla"
import Graphs from "../graphs"
import Missions from "../missions"
import Params from "../params"
import Config from "../config"
import Dashboard from "../dashboard"
import Navbar from "./navbar"

// Redux
import { useDispatch } from "react-redux"
import { ErrorBoundary } from "react-error-boundary"
import AlertProvider from "./dashboard/alertProvider"
import ErrorBoundaryFallback from "./error/errorBoundary"
import { initSocket } from "../redux/slices/socketSlice"
import { registerHandler } from "../redux/slices/loggingSlice"
import { consoleLogHandler, electronLogHandler } from "../helpers/logHandlers"

export default function AppContent() {

  // Setup sockets for redux
  const dispatch = useDispatch()
  useEffect(() => {
    
    // Only add console log handler in dev mode
    if (process.env.NODE_ENV === "development") {
      dispatch(registerHandler(consoleLogHandler))
    }
    
    dispatch(registerHandler(electronLogHandler))
    
    dispatch(initSocket())
  }, [])

  return (
    <SettingsProvider>
      <SingleRunWrapper>
        <Toolbar />
        <ErrorBoundary fallbackRender={ErrorBoundaryFallback}>
          <SettingsModal />
          <Navbar className="no-drag" />
          <Routes>
            <Route
              path="/"
              element={
                <AlertProvider>
                  <Dashboard />
                </AlertProvider>
              }
            />
            <Route path="/missions" element={<Missions />} />
            <Route path="/graphs" element={<Graphs />} />
            <Route path="/params" element={<Params />} />
            <Route path="/config" element={<Config />} />
            <Route path="/fla" element={<FLA />} />
          </Routes>
          <Commands />
        </ErrorBoundary>
      </SingleRunWrapper>
    </SettingsProvider>
  )
}
