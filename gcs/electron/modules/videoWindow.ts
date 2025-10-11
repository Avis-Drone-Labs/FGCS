import { BrowserWindow, ipcMain } from "electron"
import path from "path"

let videoPopoutWin: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

const MIN_VIDEO_HEIGHT: number = 100
const VIDEO_TITLEBAR_HEIGHT: number = 28

function loadVideo(
  type: string,
  id: string = "",
  name: string = "",
  streamUrl: string = "",
) {
  let params = "videoWindow.html"
  const urlParams = new URLSearchParams()

  if (type) urlParams.set("type", type)
  if (id) urlParams.set("deviceId", id)
  if (name) urlParams.set("deviceName", name)
  if (streamUrl) urlParams.set("streamUrl", streamUrl)

  if (urlParams.toString()) {
    params += "?" + urlParams.toString()
  }

  if (VITE_DEV_SERVER_URL) videoPopoutWin?.loadURL(VITE_DEV_SERVER_URL + params)
  else
    videoPopoutWin?.loadFile(path.join(process.env.DIST, "videoWindow.html"), {
      search: urlParams.toString(),
    })
}

export function openVideoPopout(
  type: string,
  videoStreamId: string,
  name: string,
  aspect: number,
  streamUrl: string = "",
  mainWindow: BrowserWindow | null = null,
) {
  if (videoPopoutWin === null) {
    videoPopoutWin = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "Video",
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
      alwaysOnTop: true,
    })
  }

  loadVideo(type, videoStreamId, name, streamUrl)
  videoPopoutWin.setTitle(name)

  // Handle window close events (Alt+F4, clicking X, etc.)
  videoPopoutWin.on("close", () => {
    videoPopoutWin = null // Just set to null, don't call destroyVideoWindow to avoid recursion
    mainWindow?.webContents.send("app:video-closed") // Notify main window
  })

  videoPopoutWin.on("will-resize", (event, newBounds) => {
    event.preventDefault()

    const newWidth = newBounds.width
    const newHeight = Math.round(newWidth / aspect + VIDEO_TITLEBAR_HEIGHT)

    videoPopoutWin?.setBounds({
      x: newBounds.x,
      y: newBounds.y,
      width: newWidth,
      height: newHeight,
    })
  })

  // Ensure initial size fits the aspect ratio ()
  videoPopoutWin.setSize(
    videoPopoutWin.getBounds().width,
    Math.round(videoPopoutWin.getBounds().width / aspect) +
      VIDEO_TITLEBAR_HEIGHT,
  )
  videoPopoutWin.setMinimumSize(
    Math.round(aspect * (MIN_VIDEO_HEIGHT - 28)),
    MIN_VIDEO_HEIGHT,
  )

  videoPopoutWin.show()
}

export function closeVideoPopout(mainWindow: BrowserWindow | null) {
  destroyVideoWindow()
  mainWindow?.webContents.send("app:video-closed")
}

export function destroyVideoWindow() {
  if (videoPopoutWin) {
    videoPopoutWin.removeAllListeners() // Remove all event listeners to prevent recursion
    videoPopoutWin.destroy() // Use destroy instead of close to avoid triggering close event
    videoPopoutWin = null
  }
}

export default function registerVideoIPC(mainWindow: BrowserWindow) {
  ipcMain.removeHandler("app:open-video-window")
  ipcMain.removeHandler("app:close-video-window")

  ipcMain.handle(
    "app:open-video-window",
    (_, type, videoStreamId, name, aspect, streamUrl = "") => {
      openVideoPopout(type, videoStreamId, name, aspect, streamUrl, mainWindow)
    },
  )
  ipcMain.handle("app:close-video-window", () => closeVideoPopout(mainWindow))
}
