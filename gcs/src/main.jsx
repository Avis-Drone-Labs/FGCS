import "./css/index.css" // Needs to be at the top of the file
import "./css/resizable.css"

// Style imports
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"
import "@mantine/code-highlight/styles.css"
import "@mantine/tiptap/styles.css"

// React imports
import { HashRouter } from "react-router-dom"
import React from "react"
import ReactDOM from "react-dom/client"
// Mantine imports
import { MantineProvider } from "@mantine/core"

// Component imports
import AppContent from "./components/mainContent.jsx"
import { CustomMantineTheme } from "./components/customMantineTheme.jsx"

// Redux
import { store } from "./redux/store.js"
import { Provider } from "react-redux"

ReactDOM.createRoot(document.getElementById("root")).render(
  // <MantineProvider defaultColorScheme='dark'>
  <MantineProvider defaultColorScheme="dark" theme={CustomMantineTheme}>
    <Provider store={store}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </Provider>
  </MantineProvider>,
)

// Remove Preload scripts loading
postMessage({ payload: "removeLoading" }, "*")

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message)
})
