import { BrowserWindow, ipcMain } from "electron"
import path from "path"

let webcamPopoutWin: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

const MIN_WEBCAM_HEIGHT: number = 100
const WEBCAM_TITLEBAR_HEIGHT: number = 28

/**
 * If id and name are provided, passes the id and name to the webcam popout so that the given
 * video stream is rendered. If id or name are not provided, prevents any video streams from
 * being rendered on the window so that the webcam is not showing in the background
 * @param id The device stream ID
 * @param name The name of the device
 */
function loadWebcam(id: string = "", name: string = "") {
  const params: string =
    id && name
      ? "webcam.html?deviceId=" + id + "&deviceName=" + name
      : "webcam.html"

  if (VITE_DEV_SERVER_URL)
    webcamPopoutWin?.loadURL(VITE_DEV_SERVER_URL + params)
  else
    webcamPopoutWin?.loadFile(path.join(process.env.DIST, "webcam.html"), {
      search: id && name ? `?deviceId=${id}&deviceName=${name}` : "",
    })
}

export function openWebcamPopout(
  videoStreamId: string,
  name: string,
  aspect: number,
) {
  if (webcamPopoutWin === null) {
    webcamPopoutWin = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      icon: path.join(process.env.VITE_PUBLIC, "app_icon.ico"),
      show: false,
      title: "Webcam",
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
    })
  } else {
    console.warn("2nd webcam window requested, ignoring")
  }

  loadWebcam(videoStreamId, name)
  webcamPopoutWin.setTitle(name)

  webcamPopoutWin.on("will-resize", (event, newBounds) => {
    event.preventDefault()

    const newWidth = newBounds.width
    const newHeight = Math.round(newWidth / aspect + WEBCAM_TITLEBAR_HEIGHT)

    webcamPopoutWin?.setBounds({
      x: newBounds.x,
      y: newBounds.y,
      width: newWidth,
      height: newHeight,
    })
  })

  // Ensure initial size fits the aspect ratio ()
  webcamPopoutWin.setSize(
    webcamPopoutWin.getBounds().width,
    Math.round(webcamPopoutWin.getBounds().width / aspect) +
      WEBCAM_TITLEBAR_HEIGHT,
  )
  webcamPopoutWin.setMinimumSize(
    Math.round(aspect * (MIN_WEBCAM_HEIGHT - 28)),
    MIN_WEBCAM_HEIGHT,
  )
  webcamPopoutWin.show()
}

export function closeWebcamPopout(mainWindow: BrowserWindow | null) {
  console.log("Destroying webcam window")
  destroyWebcamWindow()
  mainWindow?.webContents.send("app:webcam-closed")
}

export function destroyWebcamWindow() {
  webcamPopoutWin?.close()
  webcamPopoutWin = null
}

export default function registerWebcamIPC(mainWindow: BrowserWindow) {
  ipcMain.removeHandler("app:open-webcam-window")
  ipcMain.removeHandler("app:close-webcam-window")

  ipcMain.handle("app:open-webcam-window", (_, videoStreamId, name, aspect) => {
    openWebcamPopout(videoStreamId, name, aspect)
  })
  ipcMain.handle("app:close-webcam-window", () => closeWebcamPopout(mainWindow))
}
