import { BrowserWindow, ipcMain, shell } from "electron"
import path from "path"
import { getCenteredWindowPosition } from "../utils/windowUtils"

let aboutPopoutWin: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

export function openAboutPopout(parentWindow?: BrowserWindow) {
  if (aboutPopoutWin === null) {
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: 400,
      height: 300,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "About FGCS",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
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

    aboutPopoutWin = new BrowserWindow(windowOptions)
  }

  if (VITE_DEV_SERVER_URL) {
    aboutPopoutWin?.loadURL(VITE_DEV_SERVER_URL + "aboutWindow.html")
  } else {
    aboutPopoutWin?.loadFile(path.join(process.env.DIST, "aboutWindow.html"))
  }

  // Open links in browser, not within the electron window.
  // Note, links must have target="_blank"
  aboutPopoutWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)

    return { action: "deny" }
  })

  aboutPopoutWin.on("close", () => {
    aboutPopoutWin = null
  })
  aboutPopoutWin.setMenuBarVisibility(false)
  aboutPopoutWin.show()
}

export function closeAboutPopout() {
  destroyAboutWindow()
}

export function destroyAboutWindow() {
  aboutPopoutWin?.close()
  aboutPopoutWin = null
}

export default function registerAboutIPC() {
  ipcMain.removeHandler("app:open-about-window")
  ipcMain.removeHandler("app:close-about-window")

  ipcMain.handle("app:open-about-window", (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender)
    openAboutPopout(parentWindow || undefined)
  })
  ipcMain.handle("app:close-about-window", () => closeAboutPopout())
}
