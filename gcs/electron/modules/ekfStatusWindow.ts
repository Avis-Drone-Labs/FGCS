import { BrowserWindow, ipcMain } from "electron"
import path from "path"
import { getCenteredWindowPosition } from "../utils/windowUtils"

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

let ekfStatusWin: BrowserWindow | null = null

export function openEkfStatusWindow(parentWindow?: BrowserWindow) {
  if (ekfStatusWin === null) {
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: 700,
      height: 400,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "EKF Status",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
      alwaysOnTop: true,
    }

    // Position window in the center of the parent window
    const centeredPosition = getCenteredWindowPosition(
      parentWindow,
      windowOptions.width!,
      windowOptions.height!,
    )
    if (centeredPosition) {
      windowOptions.x = centeredPosition.x
      windowOptions.y = centeredPosition.y
    }

    ekfStatusWin = new BrowserWindow(windowOptions)
  }

  if (VITE_DEV_SERVER_URL) {
    ekfStatusWin?.loadURL(VITE_DEV_SERVER_URL + "ekfStatus.html")
  } else {
    ekfStatusWin?.loadFile(path.join(process.env.DIST, "ekfStatus.html"))
  }

  ekfStatusWin.on("close", () => {
    ekfStatusWin = null
  })
  ekfStatusWin.setMenuBarVisibility(false)
  ekfStatusWin.show()
}

export function closeEkfStatusWindow() {
  destroyEkfStatusWindow()
}

export function destroyEkfStatusWindow() {
  ekfStatusWin?.close()
  ekfStatusWin = null
}

export default function registerEkfStatusIPC() {
  ipcMain.removeHandler("app:open-ekf-status-window")
  ipcMain.removeHandler("app:close-ekf-status-window")
  ipcMain.removeHandler("app:update-ekf-status")

  ipcMain.handle("app:open-ekf-status-window", (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender)
    openEkfStatusWindow(parentWindow || undefined)
  })
  ipcMain.handle("app:close-ekf-status-window", () => closeEkfStatusWindow())
  ipcMain.handle("app:update-ekf-status", (_, ekfStatusData) => {
    ekfStatusWin?.webContents.send("app:send-ekf-status", ekfStatusData)
  })
}
