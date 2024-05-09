import { BrowserWindow, app, ipcMain } from 'electron'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import os from 'os'
import openFile from './fla'
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let loadingWin: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'app_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    alwaysOnTop: true
  })

  win.setMenuBarVisibility(false)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // Swap to main window when ready
  win.once('ready-to-show', () => {
    loadingWin?.destroy()
    win?.maximize()
    // Window starts always on top so it opens even if loading window is hid
    win?.setAlwaysOnTop(false)
  })
}

function createLoadingWindow(){
  loadingWin= new BrowserWindow({
    frame: false,
    transparent: true,
    center: true,
  });

  // Resize and center window
  loadingWin.loadFile(path.join(process.env.VITE_PUBLIC, 'window_loading_icon.svg'))
  loadingWin.setSize(300, 300, true);
  loadingWin.center();
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createLoadingWindow()
  ipcMain.handle('fla:open-file', openFile)
  ipcMain.handle('fla:get-fgcs-logs', async () => {
    const fgcsLogsPath = path.join(os.homedir(), 'FGCS','logs')
    const fgcsLogs = await glob(path.join(fgcsLogsPath, '*.ftlog'), {nodir: true, windowsPathsNoEscape:true}) // Get a list of .ftlog files
    const slicedFgcsLogs = fgcsLogs.slice(0, 20) // Only return the last 20 logs

    return slicedFgcsLogs.map((logPath) => {
      const logName = path.basename(logPath, '.ftlog')
      const fileStats = fs.statSync(logPath)
      return {
        name: logName,
        path: logPath,
        size: fileStats.size
      }
    })
  })
  createWindow()
})
