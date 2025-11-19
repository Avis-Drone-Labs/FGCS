/*
  The main wrapper for the app
*/

import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"

import SettingsModal from "./settingsModal"
import { Commands } from "./spotlight/commandHandler"
import Toolbar from "./toolbar/toolbar"

// Wrappers
import { SettingsProvider } from "../helpers/settingsProvider"
import SingleRunWrapper from "./SingleRunWrapper"

// Routes
import Config from "../config"
import Dashboard from "../dashboard"
import FLA from "../fla"
import Graphs from "../graphs"
import Missions from "../missions"
import Params from "../params"
import Navbar from "./navbar"

// Redux
import { ErrorBoundary } from "react-error-boundary"
import { useDispatch, useSelector } from "react-redux"
import { initSocket } from "../redux/slices/socketSlice"
import { selectConnectedToDrone } from "../redux/slices/droneConnectionSlice"
import AlertProvider from "./dashboard/alerts/alertProvider"
import ErrorBoundaryFallback from "./error/errorBoundary"

export default function AppContent() {
  // Setup sockets for redux
  const dispatch = useDispatch()
  const connectedToDrone = useSelector(selectConnectedToDrone)
  useEffect(() => {
    dispatch(initSocket())
  }, [])

  // Send connection state changes to main so it can own quit policy on macOS
  useEffect(() => {
    try {
      window.ipcRenderer.send("app:connected-state", connectedToDrone)
    } catch {}
  }, [connectedToDrone])

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
