import "./css/index.css" // Needs to be at the top of the file
import "./css/resizable.css"

// Style imports
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"
import "@mantine/code-highlight/styles.css"
import "@mantine/tiptap/styles.css"

import React from "react"
import ReactDOM from "react-dom/client"
import CameraWindow from "./components/dashboard/webcam/webcam"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CameraWindow />
  </React.StrictMode>,
)

postMessage({ payload: "removeLoading" }, "*")
