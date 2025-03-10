import { BrowserWindow, Menu, MenuItemConstructorOptions, MessageBoxOptions, app, dialog, ipcMain, nativeImage, shell } from 'electron'
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import packageInfo from '../package.json'

// @ts-expect-error - no types available
import openFile, { getRecentFiles, clearRecentFiles } from './fla'
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
let webcamPopoutWin: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let pythonBackend: ChildProcessWithoutNullStreams | null = null

function getWindow() {
  return BrowserWindow.getFocusedWindow()
}

// Settings logic

interface Settings {
  version: string,
  settings: object
}

let userSettings: Settings | null = null

function saveUserConfiguration(settings: Settings){
  userSettings = settings;
  fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(userSettings, null,  2), 'utf-8');
}

/**
 * Checks the application version within the loaded user settings and updates if it is outdated
 * @param configPath The path to the configuration file
 * @returns
 */
function checkAppVersion(configPath: string){

  if (userSettings === null){
    console.warn("Attempting to check app version when user settings have not been loaded");
    return;
  }

  if (userSettings.version == app.getVersion())
    return;

  userSettings.version = app.getVersion();
  fs.writeFileSync(configPath, JSON.stringify(userSettings))
}

/**
 * Called when the application requests user settings
 *
 * @returns
 */
function getUserConfiguration(){

  // Return the already loaded user settings if loaded
  console.log("Fetching user settings!");
  if (userSettings !== null) return userSettings


  // Directories
  const userDir = app.getPath('userData');
  const config = path.join(userDir, 'settings.json');

  // Write version and blank settings to user config if doesn't exist
  if (!fs.existsSync(config)) {
    console.log("Generating user settings")
    userSettings = {version: app.getVersion(), settings: {}}
    fs.writeFileSync(config, JSON.stringify(userSettings))
  } else{
    console.log("Reading user settings from config file " + config)
    userSettings = JSON.parse(fs.readFileSync(config, 'utf-8'))
    checkAppVersion(config)
  }
  return userSettings
}

ipcMain.handle("getSettings", () => {return getUserConfiguration(); })
ipcMain.handle("setSettings", (_, settings) => {saveUserConfiguration(settings)})

// Webcam popout window

const MIN_WEBCAM_HEIGHT: number = 100
const WEBCAM_TITLEBAR_HEIGHT: number = 28

function openWebcamPopout(videoStreamId: string, name: string, aspect: number){

  if (webcamPopoutWin === null) return;

  webcamPopoutWin.loadURL("http://localhost:5173/#/webcam?deviceId=" + videoStreamId + "&deviceName=" + name);
  webcamPopoutWin.setAlwaysOnTop(true)


  webcamPopoutWin.on('will-resize', (event, newBounds) => {

    event.preventDefault();

    let newWidth, newHeight;

    if (win?.getBounds().width === newBounds.width){
      // Scale by height only
      newHeight = newBounds.height;
      newWidth = Math.round((newHeight - WEBCAM_TITLEBAR_HEIGHT) * aspect)
    } else{
      newWidth = newBounds.width;
      newHeight = Math.round((newWidth / aspect) + WEBCAM_TITLEBAR_HEIGHT);
    }

    webcamPopoutWin?.setBounds({
      x: newBounds.x,
      y: newBounds.y,
      width: newWidth,
      height: newHeight
    });
  })

  webcamPopoutWin.setSize(webcamPopoutWin.getBounds().width, Math.round(webcamPopoutWin.getBounds().width / aspect) + 28);
  webcamPopoutWin.setMinimumSize(Math.round(aspect * (MIN_WEBCAM_HEIGHT-28)), MIN_WEBCAM_HEIGHT);
  webcamPopoutWin.show();

}

function closeWebcamPopout(){
  webcamPopoutWin?.hide()
  win?.webContents.send("webcam-closed");
}

ipcMain.handle("openWebcamWindow", (_, videoStreamId, name, aspect) => {openWebcamPopout(videoStreamId, name, aspect)})
ipcMain.handle("closeWebcamWindow", () => closeWebcamPopout())


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
  const window = getWindow()?.webContents;
  window?.setZoomFactor(window?.getZoomFactor() + 0.1)
})
ipcMain.on("zoom_out", () => {
  const window = getWindow()?.webContents;
  window?.setZoomFactor(window?.getZoomFactor() - 0.1)
})
ipcMain.on("openFileInExplorer", (_event, filePath) => {shell.showItemInFolder(filePath)})

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

  // Create webcam window keep it hidden to avoid delay between popping out windows
  webcamPopoutWin = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: false,
    show: false,
    title: "Webcam",
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  webcamPopoutWin.loadURL("http://localhost:5173/#/webcam")

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

  // Set Main Menu on Mac Only
  if(process.platform === 'darwin'){
    setMainMenu()
  }

}

// For Mac only
function setMainMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        {
          label: 'About FGCS',
          click: async () => {
            const icon = nativeImage.createFromPath(path.join(__dirname, '../public/window_loading_icon-2.png'))

            const options: MessageBoxOptions = {
              type: 'info',
              buttons: [ 'OK','Report a bug',],
              title: 'About FGCS',
              message: 'FGCS Version: ' + app.getVersion(), // get version from package.json
              detail: 'For more information, visit our GitHub page.',
              icon: icon,
              defaultId: 1,
            };

          const response = await dialog.showMessageBox(options);
            if (response.response === 1) {
              shell.openExternal(packageInfo.bugs.url)
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Report a bug',
          click: async () => {
            await shell.openExternal(
              packageInfo.bugs.url,
            )
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
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
  // Open file and Get Recent Logs
  ipcMain.handle('fla:open-file', openFile)
  ipcMain.handle('fla:get-recent-logs', async () => {
    try {
      const recentLogs = getRecentFiles();
      if (!Array.isArray(recentLogs)) {
        throw new Error(
          `Expected recentLogs to be an array, but got ${typeof recentLogs}`,
        )
      }
      return recentLogs.map((logPath) => {
        const logName = path.basename(logPath)
        const fileStats = fs.statSync(logPath)
        return {
          name: logName,
          path: logPath,
          size: fileStats.size,
          timestamp: fileStats.mtime,
        }
      })
    } catch (error) {
      return []
    }
  })
  // Clear recent logs
  ipcMain.handle('fla:clear-recent-logs', clearRecentFiles)

  ipcMain.handle('app:get-node-env', () =>
    app.isPackaged ? 'production' : 'development',
  )
  ipcMain.handle('app:get-version', () => app.getVersion())

  if (app.isPackaged && pythonBackend === null) {
    startBackend()
  }

  // Load user settings
  createWindow()
})
