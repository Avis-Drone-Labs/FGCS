import { BrowserWindow, app, ipcMain, shell, webFrame } from 'electron'
import { glob } from 'glob'
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'os'
import packageInfo from '../package.json'

// @ts-expect-error - no types available
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

// Fix UI Scaling
app.commandLine.appendSwitch('high-dpi-support', '1')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

let win: BrowserWindow | null
let loadingWin: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let pythonBackend: ChildProcessWithoutNullStreams | null = null

function getWindow() {
  return BrowserWindow.getFocusedWindow()
}

ipcMain.handle("isMac", () => { return process.platform == "darwin" })
ipcMain.on('close', () => {closeWithBackend()})
ipcMain.on('minimise', () => {getWindow()?.minimize()})
ipcMain.on('maximise', () => {getWindow()?.isMaximized() ? getWindow()?.unmaximize() : getWindow()?.maximize()})
ipcMain.on("reload", () => {getWindow()?.reload()})
ipcMain.on("force_reload", () => {getWindow()?.webContents.reloadIgnoringCache()})
ipcMain.on("toggle_developer_tools", () => {getWindow()?.webContents.toggleDevTools()})
ipcMain.on("actual_size", () => {getWindow()?.webContents.setZoomFactor(1)})
ipcMain.on("toggle_fullscreen", () => {getWindow()?.isFullScreen() ? getWindow()?.setFullScreen(false) : getWindow()?.setFullScreen(true)})
ipcMain.on("zoom_in", () => {
  let window = getWindow()?.webContents;
  window?.setZoomFactor(window?.getZoomFactor() + 0.1)
})
ipcMain.on("zoom_out", () => {
  let window = getWindow()?.webContents;
  window?.setZoomFactor(window?.getZoomFactor() - 0.1)
})

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'app_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    show: false,
    alwaysOnTop: true,
    minWidth: 750,
    minHeight: 500,
    titleBarStyle: 'hidden',
    frame: false,
  })

  // Open links in browser, not within the electron window.
  // Note, links must have target="_blank"
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)

    return { action: 'deny' }
  })

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

function createLoadingWindow() {
  loadingWin = new BrowserWindow({
    frame: false,
    transparent: true,
    center: true,
  })

  // Resize and center window
  loadingWin.loadFile(
    path.join(process.env.VITE_PUBLIC, 'window_loading_icon.svg'),
  )
  loadingWin.setSize(300, 300, true)
  loadingWin.center()
}

function startBackend() {
  if (pythonBackend) {
    console.log('Backend already running');
    return;
  }

  console.log('Starting backend');

  // Add more platforms here
  const backendPaths: Partial<Record<NodeJS.Platform, string>> ={
    win32: 'extras/fgcs_backend.exe',
    darwin: path.join(process.resourcesPath, '../extras', 'fgcs_backend.app', 'Contents', 'MacOS', 'fgcs_backend')
  };

  const backendPath = backendPaths[process.platform];

  if (!backendPath) {
    console.error('Unsupported platform!');
    return;
  }

  console.log(`Starting backend: ${backendPath}`);
  pythonBackend = spawn(backendPath);

  // pythonBackend.stdout.on('data', (data) => console.log(`Backend stdout: ${data}`));
  // pythonBackend.stderr.on('data', (data) => console.error(`Backend stderr: ${data}`));

  pythonBackend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    pythonBackend = null;
  });

  pythonBackend.on('error', (error) => {
    console.error('Failed to start backend:', error);
    dialog.showErrorBox('Backend Error', `Failed to start backend: ${error.message}`);
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
function closeWithBackend() {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
  
  console.log('Killing backend')
  // kill any processes with the name "fgcs_backend.exe"
  // Windows
  spawn('taskkill /f /im fgcs_backend.exe', { shell: true })
}
app.on('window-all-closed', () => {
  closeWithBackend();
})

// To ensure that the backend process is killed with Cmd + Q on macOS,
// listen to the before-quit event. 
app.on('before-quit', () => {
  if(process.platform === 'darwin' && pythonBackend){
    console.log('Stopping backend')
    spawnSync('pkill', ['-f', 'fgcs_backend']);
    pythonBackend = null
  }
});

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
    const fgcsLogsPath = path.join(os.homedir(), 'FGCS', 'logs')
    try {
      const fgcsLogs = await glob(path.join(fgcsLogsPath, '*.ftlog'), {
        nodir: true,
        windowsPathsNoEscape: true,
      }) // Get a list of .ftlog files
      if (!Array.isArray(fgcsLogs)) {
        throw new Error(
          `Expected fgcsLogs to be an array, but got ${typeof fgcsLogs}`,
        )
      }
      const slicedFgcsLogs = fgcsLogs.slice(0, 20) // Only return the last 20 logs

      return slicedFgcsLogs.map((logPath) => {
        const logName = path.basename(logPath, '.ftlog')
        const fileStats = fs.statSync(logPath)
        return {
          name: logName,
          path: logPath,
          size: fileStats.size,
        }
      })
    } catch (error) {
      return []
    }
  })
  ipcMain.handle('app:get-node-env', () =>
    app.isPackaged ? 'production' : 'development',
  )
  ipcMain.handle('app:get-version', () => app.getVersion())

  if (app.isPackaged && pythonBackend === null) {
    startBackend()
  }

  createWindow()
})
