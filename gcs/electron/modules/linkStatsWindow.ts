import { BrowserWindow, ipcMain } from "electron"
import path from "path"

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

let linkStatsWin: BrowserWindow | null = null

export function openLinkStatsWindow() {
  if (linkStatsWin === null) {
    linkStatsWin = new BrowserWindow({
      width: 500,
      height: 300,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "Connection Stats",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
    })
  }

  if (VITE_DEV_SERVER_URL) {
    linkStatsWin?.loadURL(VITE_DEV_SERVER_URL + "linkStats.html")
  } else {
    linkStatsWin?.loadFile(path.join(process.env.DIST, "linkStats.html"))
  }

  linkStatsWin.on("close", () => {
    linkStatsWin = null
  })
  linkStatsWin.setMenuBarVisibility(false)
  linkStatsWin.show()
}

export function closeLinkStatsWindow() {
  destroyLinkStatsWindow()
}

export function destroyLinkStatsWindow() {
  linkStatsWin?.close()
  linkStatsWin = null
}

export default function registerLinkStatsIPC() {
  ipcMain.removeHandler("app:open-link-stats-window")
  ipcMain.removeHandler("app:close-link-stats-window")
  ipcMain.removeHandler("app:update-link-stats")

  ipcMain.handle("app:open-link-stats-window", () => {
    openLinkStatsWindow()
  })
  ipcMain.handle("app:close-link-stats-window", () => closeLinkStatsWindow())
  ipcMain.handle("app:update-link-stats", (_, linkStats) => {
    linkStatsWin?.webContents.send("app:send-link-stats", linkStats)
    const uptimeFormatted = new Date(Math.round(linkStats.uptime) * 1000)
      .toISOString()
      .substring(11, 19)
    linkStatsWin?.setTitle(`Connection Stats | Uptime: ${uptimeFormatted}`)
  })
}
