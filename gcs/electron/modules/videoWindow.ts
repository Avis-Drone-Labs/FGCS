import { BrowserWindow, ipcMain } from "electron"
import path from "path"

let videoPopoutWin: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

const MIN_VIDEO_HEIGHT: number = 100
const VIDEO_TITLEBAR_HEIGHT: number = 28

function loadVideo(id: string = "", name: string = "") {
  const params: string =
    id && name
      ? "video.html?deviceId=" + id + "&deviceName=" + name
      : "video.html"

  if (VITE_DEV_SERVER_URL) videoPopoutWin?.loadURL(VITE_DEV_SERVER_URL + params)
  else
    videoPopoutWin?.loadFile(path.join(process.env.DIST, "video.html"), {
      search: id && name ? `?deviceId=${id}&deviceName=${name}` : "",
    })
}

export function openVideoPopout(
  videoStreamId: string,
  name: string,
  aspect: number,
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

  loadVideo(videoStreamId, name)
  videoPopoutWin.setTitle(name)

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
  videoPopoutWin?.close()
  videoPopoutWin = null
}

export default function registerVideoIPC(mainWindow: BrowserWindow) {
  ipcMain.removeHandler("app:open-video-window")
  ipcMain.removeHandler("app:close-video-window")

  ipcMain.handle("app:open-video-window", (_, videoStreamId, name, aspect) => {
    openVideoPopout(videoStreamId, name, aspect)
  })
  ipcMain.handle("app:close-video-window", () => closeVideoPopout(mainWindow))
}
