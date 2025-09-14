import { contextBridge, ipcRenderer } from "electron"

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  ...withPrototype(ipcRenderer),
  loadFile: (data) => ipcRenderer.invoke("fla:open-file", data),
  getRecentLogs: () => ipcRenderer.invoke("fla:get-recent-logs"),
  clearRecentLogs: () => ipcRenderer.invoke("fla:clear-recent-logs"),
  getSaveMissionFilePath: (options) =>
    ipcRenderer.invoke("missions:get-save-mission-file-path", options),
  getNodeEnv: () => ipcRenderer.invoke("app:get-node-env"),
  isDev: () => ipcRenderer.invoke("app:get-node-env") != "production",
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getSettings: () => ipcRenderer.invoke("getSettings"),
  saveSettings: (settings) => ipcRenderer.invoke("setSettings", settings),
  openWebcamWindow: (id, name, aspect) =>
    ipcRenderer.invoke("openWebcamWindow", id, name, aspect),
  closeWebcamWindow: () => ipcRenderer.invoke("closeWebcamWindow"),
  onCameraWindowClose: (callback) =>
    ipcRenderer.on("webcam-closed", () => callback()),
  pushLog: (msg) => ipcRenderer.invoke("logMessage", msg),
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
  openAboutWindow: () => ipcRenderer.invoke("openAboutWindow"),
  closeAboutWindow: () => ipcRenderer.invoke("closeAboutWindow"),
  openLinkStatsWindow: () => ipcRenderer.invoke("openLinkStatsWindow"),
  closeLinkStatsWindow: () => ipcRenderer.invoke("closeLinkStatsWindow"),
  updateLinkStats: (linkStats) =>
    ipcRenderer.invoke("update-link-stats", linkStats),
  onGetLinkStats: (callback) =>
    ipcRenderer.on("send-link-stats", (_, stats) => callback(stats)),
})

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj) {
  const protos = Object.getPrototypeOf(obj)

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (typeof value === "function") {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}

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
