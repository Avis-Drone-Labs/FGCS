import path from "path";
import { BrowserWindow, Event, ipcMain, Rectangle } from "electron";

let webcamPopoutWin: BrowserWindow | null

const MIN_WEBCAM_HEIGHT: number = 100
const WEBCAM_TITLEBAR_HEIGHT: number = 28

// eslint-disable-next-line no-unused-vars
type ResizeCallback = (event: Event, arg1: Rectangle) => void;

let currentResizeHandler: ResizeCallback | null = null

export function setupWebcamWindow(){
    webcamPopoutWin = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        icon: path.join(process.env.VITE_PUBLIC, 'app_icon.ico'),
        show: false,
        title: "Webcam",
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        },
        fullscreen: false,
        fullscreenable: false,
    });
    webcamPopoutWin.loadURL("http://localhost:5173/#/webcam")
}

export function openWebcamPopout(videoStreamId: string, name: string, aspect: number){

    if (webcamPopoutWin === null) return;

    webcamPopoutWin.loadURL("http://localhost:5173/#/webcam?deviceId=" + videoStreamId + "&deviceName=" + name);
    webcamPopoutWin.setTitle(name);

    // Remove previous resize handler
    if (currentResizeHandler)
        webcamPopoutWin.off("will-resize", currentResizeHandler)

    // Create resize handler to maintain aspect ratio
    currentResizeHandler = function(event, newBounds){
        event.preventDefault();

        const newWidth = newBounds.width;
        const newHeight = Math.round((newWidth / aspect) + WEBCAM_TITLEBAR_HEIGHT);

        webcamPopoutWin?.setBounds({
        x: newBounds.x,
        y: newBounds.y,
        width: newWidth,
        height: newHeight
        });
    }

    webcamPopoutWin.on('will-resize', currentResizeHandler);

    // Ensure initial size fits the aspect ratio ()
    webcamPopoutWin.setSize(webcamPopoutWin.getBounds().width, Math.round(webcamPopoutWin.getBounds().width / aspect) + WEBCAM_TITLEBAR_HEIGHT);

    webcamPopoutWin.setMinimumSize(Math.round(aspect * (MIN_WEBCAM_HEIGHT-28)), MIN_WEBCAM_HEIGHT);
    webcamPopoutWin.show();

}

export function closeWebcamPopout(mainWindow: BrowserWindow | null){
    webcamPopoutWin?.hide()
    webcamPopoutWin?.loadURL("http://localhost:5173/#/webcam")
    mainWindow?.webContents.send("webcam-closed");
}

export function destroyWebcamWindow(){
    webcamPopoutWin?.close()
    webcamPopoutWin = null
}

export default function registerWebcamIPC(mainWindow: BrowserWindow){
    ipcMain.handle("openWebcamWindow", (_, videoStreamId, name, aspect) => {openWebcamPopout(videoStreamId, name, aspect)})
    ipcMain.handle("closeWebcamWindow", () => closeWebcamPopout(mainWindow))
}