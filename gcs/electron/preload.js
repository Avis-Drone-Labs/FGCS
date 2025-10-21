import { contextBridge, ipcRenderer } from "electron"

// --------- Expose some API to the Renderer process ---------
// Whitelist of allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = [
  "fla:open-file",
  "fla:get-recent-logs",
  "fla:clear-recent-logs",
  "fla:get-messages",
  "missions:get-save-mission-file-path",
  "app:get-node-env",
  "app:get-version",
  "app:is-mac",
  "settings:fetch-settings",
  "settings:save-settings",
  "app:open-webcam-window",
  "app:close-webcam-window",
  "app:open-about-window",
  "app:close-about-window",
  "app:open-link-stats-window",
  "app:close-link-stats-window",
  "app:update-link-stats",
  "window:select-file-in-explorer",
  "app:update-ekf-status",
  "app:open-ekf-status-window",
  "app:update-vibe-status",
  "app:open-vibe-status-window",
]

const ALLOWED_SEND_CHANNELS = [
  "window:close",
  "window:minimise",
  "window:maximise",
  "window:reload",
  "window:force-reload",
  "window:toggle-developer-tools",
  "window:actual-size",
  "window:toggle-fullscreen",
  "window:zoom-in",
  "window:zoom-out",
  "window:open-file-in-explorer",
]

const ALLOWED_ON_CHANNELS = [
  "main-process-message",
  "app:webcam-closed",
  "app:send-link-stats",
  "fla:log-parse-progress",
  "app:send-ekf-status",
  "app:send-vibe-status",
]

contextBridge.exposeInMainWorld("ipcRenderer", {
  // Secure invoke method - only allows whitelisted channels
  invoke: (channel, ...args) => {
    if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`IPC invoke channel '${channel}' is not allowed`)
  },

  // Secure send method - only allows whitelisted channels
  send: (channel, ...args) => {
    if (ALLOWED_SEND_CHANNELS.includes(channel)) {
      return ipcRenderer.send(channel, ...args)
    }
    throw new Error(`IPC send channel '${channel}' is not allowed`)
  },

  // Secure on method - only allows whitelisted channels
  on: (channel, callback) => {
    if (ALLOWED_ON_CHANNELS.includes(channel)) {
      return ipcRenderer.on(channel, callback)
    }
    throw new Error(`IPC on channel '${channel}' is not allowed`)
  },

  // Secure removeAllListeners - only for whitelisted channels
  removeAllListeners: (channel) => {
    if (ALLOWED_ON_CHANNELS.includes(channel)) {
      return ipcRenderer.removeAllListeners(channel)
    }
    throw new Error(
      `IPC removeAllListeners channel '${channel}' is not allowed`,
    )
  },
})

// --------- Preload scripts loading ---------
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      parent.appendChild(child)
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement("style")
  const oDiv = document.createElement("div")

  oStyle.id = "app-loading-style"
  oStyle.innerHTML = styleContent
  oDiv.className = "app-loading-wrap"
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

// eslint-disable-next-line react-hooks/rules-of-hooks
const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading()
}

setTimeout(removeLoading, 4999)
