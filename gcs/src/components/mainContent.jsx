import { Route, Routes, useLocation } from "react-router-dom"

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
import CameraWindow from "./dashboard/webcam/webcam"
import Dashboard from "../dashboard"

// Redux
import { store } from "../redux/store"
import { Provider } from "react-redux"
import { ErrorBoundary } from "react-error-boundary"
import AlertProvider from "./dashboard/alertProvider"
import ErrorBoundaryFallback from "./error/errorBoundary"

export default function AppContent() {
  // Conditionally render UI so the webcam route is literally just a webcam
  const renderUI = useLocation().pathname !== "/webcam"

  return (
    <SettingsProvider>
      <SingleRunWrapper>
        {renderUI && <Toolbar />}
        <ErrorBoundary fallbackRender={ErrorBoundaryFallback}>
          <SettingsModal />
          <Routes>
            <Route path="/" element={
              <AlertProvider>
                <Dashboard />
              </AlertProvider>
            } />
            <Route path="/missions" element={<Missions />} />
            <Route path="/graphs" element={<Graphs />} />
            <Route path="/params" element={<Params />} />
            <Route path="/config" element={<Config />} />
            <Route path="/webcam" element={<CameraWindow />} />
            <Route
              path="/fla"
              element={
                <Provider store={store}>
                  <FLA />
                </Provider>
              }
            />
          </Routes>
          {renderUI && <Commands />}
        </ErrorBoundary>
      </SingleRunWrapper>
    </SettingsProvider>
  )
}
