import { BrowserWindow, ipcMain } from "electron"
import path from "path"

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

let vibeStatusWin: BrowserWindow | null = null

export function openVibeStatusWindow() {
  if (vibeStatusWin === null) {
    vibeStatusWin = new BrowserWindow({
      width: 600,
      height: 250,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "Vibration Status",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
      alwaysOnTop: true,
    })
  }

  if (VITE_DEV_SERVER_URL) {
    vibeStatusWin?.loadURL(VITE_DEV_SERVER_URL + "vibeStatus.html")
  } else {
    vibeStatusWin?.loadFile(path.join(process.env.DIST, "vibeStatus.html"))
  }

  vibeStatusWin.on("close", () => {
    vibeStatusWin = null
  })
  vibeStatusWin.setMenuBarVisibility(false)
  vibeStatusWin.show()
}

export function closeVibeStatusWindow() {
  destroyVibeStatusWindow()
}

export function destroyVibeStatusWindow() {
  vibeStatusWin?.close()
  vibeStatusWin = null
}

export default function registerVibeStatusIPC() {
  ipcMain.removeHandler("app:open-vibe-status-window")
  ipcMain.removeHandler("app:close-vibe-status-window")
  ipcMain.removeHandler("app:update-vibe-status")

  ipcMain.handle("app:open-vibe-status-window", () => {
    openVibeStatusWindow()
  })
  ipcMain.handle("app:close-vibe-status-window", () => closeVibeStatusWindow())
  ipcMain.handle("app:update-vibe-status", (_, vibeStatusData) => {
    vibeStatusWin?.webContents.send("app:send-vibe-status", vibeStatusData)
  })
}
