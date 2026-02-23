import { BrowserWindow, ipcMain } from "electron"
import path from "path"

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"]

type GraphKey = "graph_a" | "graph_b" | "graph_c" | "graph_d"

type GraphWindowMeta = {
  id: string
  msg: string
  field: string
  title: string
  description?: string
  label?: string
}

type OpenArgs = {
  graphKey: GraphKey
  meta: GraphWindowMeta
}

type CloseArgs = {
  graphKey: GraphKey
}

type GraphPoint = {
  graphKey: GraphKey
  data: { x: number; y: number }
}

const graphWins: Partial<Record<GraphKey, BrowserWindow>> = {}

/** Get a window if it's still usable; auto-clean if destroyed. */
function getGraphWin(graphKey: GraphKey): BrowserWindow | null {
  const win = graphWins[graphKey]
  if (!win) return null

  if (win.isDestroyed()) {
    graphWins[graphKey] = undefined
    return null
  }

  if (win.webContents.isDestroyed()) {
    graphWins[graphKey] = undefined
    return null
  }

  return win
}

export function openGraphWindow({ graphKey, meta }: OpenArgs) {
  // Reuse existing window if it's alive
  let win = getGraphWin(graphKey)

  if (!win) {
    win = new BrowserWindow({
      width: 700,
      height: 350,
      frame: true,
      icon: path.join(process.env.VITE_PUBLIC!, "app_icon.ico"),
      show: false,
      title: meta?.title ?? "Graph",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
      fullscreen: false,
      fullscreenable: false,
      alwaysOnTop: true,
    })

    graphWins[graphKey] = win
    win.setMenuBarVisibility(false)

    // IMPORTANT: clean up reference when user closes window
    win.on("closed", () => {
      graphWins[graphKey] = undefined
    })

    // Load content only on first creation
    if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL + "graphWindow.html")
    } else {
      win.loadFile(path.join(process.env.DIST!, "graphWindow.html"))
    }

    // When page finishes loading, send init
    win.webContents.once("did-finish-load", () => {
      // Guard again just in case it got closed mid-load
      const alive = getGraphWin(graphKey)
      if (!alive) return
      alive.webContents.send("app:graph-window:init", { graphKey, meta })
    })
  } else {
    // Window already exists: just update title + init payload
    try {
      win.setTitle(meta?.title ?? "Graph")
      win.webContents.send("app:graph-window:init", { graphKey, meta })
    } catch (e) {
      // If it threw, treat it as dead and try again once
      graphWins[graphKey] = undefined
      return openGraphWindow({ graphKey, meta })
    }
  }

  // Show/focus safely
  if (!win.isDestroyed()) {
    win.show()
    win.focus()
  }
}

export function closeGraphWindow({ graphKey }: CloseArgs) {
  const win = getGraphWin(graphKey)
  if (!win) return

  // Do NOT set undefined here — let the 'closed' event clean up.
  win.close()
}

export function destroyAllGraphWindows() {
  ;(Object.keys(graphWins) as GraphKey[]).forEach((k) => {
    const win = getGraphWin(k)
    win?.close()
  })
}

export default function registerGraphWindowIPC() {
  ipcMain.removeHandler("app:open-graph-window")
  ipcMain.removeHandler("app:close-graph-window")
  ipcMain.removeHandler("app:update-graph-windows")

  ipcMain.handle("app:open-graph-window", (_event, args: OpenArgs) => {
    openGraphWindow(args)
  })

  ipcMain.handle("app:close-graph-window", (_event, args: CloseArgs) => {
    closeGraphWindow(args)
  })

  ipcMain.handle(
    "app:update-graph-windows",
    (_event, graphResults: GraphPoint[] | false) => {
      if (!graphResults) return

      for (const result of graphResults) {
        const win = getGraphWin(result.graphKey)
        if (!win) continue

        try {
          win.webContents.send("app:send-graph-point", result)
        } catch {
          // If it errors during close, drop it
          graphWins[result.graphKey] = undefined
        }
      }
    },
  )
}
