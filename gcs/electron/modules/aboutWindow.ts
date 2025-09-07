import { BrowserWindow, ipcMain } from "electron"
import path from "path"

let aboutPopoutWin: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

export function openAboutPopout() {
  if (aboutPopoutWin === null) {
    aboutPopoutWin = new BrowserWindow({
      width: 400,
      height: 300,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "About FGCS",
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
    })
  }

  if (VITE_DEV_SERVER_URL) {
    aboutPopoutWin?.loadURL(VITE_DEV_SERVER_URL + "aboutWindow.html")
  } else {
    aboutPopoutWin?.loadFile(path.join(process.env.DIST, "aboutWindow.html"))
  }

  // aboutPopoutWin.on('will-resize', (event, newBounds) => {
  //     event.preventDefault();

  //     const newWidth = newBounds.width;
  //     const newHeight = Math.round((newWidth / aspect) + WEBCAM_TITLEBAR_HEIGHT);

  //     aboutPopoutWin?.setBounds({
  //         x: newBounds.x,
  //         y: newBounds.y,
  //         width: newWidth,
  //         height: newHeight
  //     });
  // });

  // Windows doesn't consider maximising to be fullscreening so we must prevent default
  aboutPopoutWin.on("maximize", (e: Event) => {
    e.preventDefault()
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
  ipcMain.handle("openAboutWindow", () => {
    openAboutPopout()
  })
  ipcMain.handle("closeAboutWindow", () => closeAboutPopout())
}
