import { BrowserWindow, ipcMain } from "electron"
import path from "path"
import { ParamObject } from "../types/flaTypes"

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

let flaParamsWin: BrowserWindow | null = null

export function openFlaParamsWindow(
  paramsData: ParamObject[] | null,
  fileName: string | null,
) {
  if (flaParamsWin !== null) {
    destroyFlaParamsWindow()
  }

  flaParamsWin = new BrowserWindow({
    width: 800,
    height: 1200,
    frame: true,
    icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
    show: false,
    title: `FLA Params${fileName ? ` - ${fileName}` : ""}`,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    fullscreen: false,
    fullscreenable: false,
  })

  if (VITE_DEV_SERVER_URL) {
    flaParamsWin?.loadURL(VITE_DEV_SERVER_URL + "flaParams.html")
  } else {
    flaParamsWin?.loadFile(path.join(process.env.DIST, "flaParams.html"))
  }

  flaParamsWin.on("close", () => {
    flaParamsWin = null
  })
  flaParamsWin.setMenuBarVisibility(false)
  flaParamsWin.show()

  if (paramsData !== null) {
    flaParamsWin.webContents.once("did-finish-load", () => {
      flaParamsWin?.webContents.send("app:send-fla-params", paramsData)
    })
  }
}

export function closeFlaParamsWindow() {
  destroyFlaParamsWindow()
}

export function destroyFlaParamsWindow() {
  flaParamsWin?.close()
  flaParamsWin = null
}

export default function registerFlaParamsIPC() {
  ipcMain.removeHandler("app:open-fla-params-window")
  ipcMain.removeHandler("app:close-fla-params-window")

  ipcMain.handle("app:open-fla-params-window", (_, data) => {
    openFlaParamsWindow(data.params, data.fileName)
  })
  ipcMain.handle("app:close-fla-params-window", () => closeFlaParamsWindow())
}
