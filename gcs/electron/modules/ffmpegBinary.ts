import { app, ipcMain } from "electron"
import fs from "fs"
import path from "path"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffbinaries = require("ffbinaries")

const FFMPEG_PLATFORMS: Record<string, string> = {
  win32: "windows-64",
  darwin: "osx-64",
  linux: "linux-64",
}

/**
 * Get the FFmpeg binary directory (same location as user settings)
 */
function getFFmpegBinaryDir(): string {
  const userDataPath = app.getPath("userData")
  return path.join(userDataPath, "ffmpeg")
}

/**
 * Get the expected FFmpeg binary path for the current platform
 */
function getFFmpegBinaryPath(): string {
  const binaryDir = getFFmpegBinaryDir()
  const platform = process.platform

  if (platform === "win32") {
    return path.join(binaryDir, "ffmpeg.exe")
  } else {
    return path.join(binaryDir, "ffmpeg")
  }
}

/**
 * Check if FFmpeg binary exists and is executable
 */
function checkFFmpegBinaryExists(): boolean {
  const binaryPath = getFFmpegBinaryPath()
  try {
    return fs.existsSync(binaryPath) && fs.statSync(binaryPath).isFile()
  } catch (error) {
    console.error("Error checking FFmpeg binary:", error)
    return false
  }
}

/**
 * Download FFmpeg binary using ffbinaries
 */
async function downloadFFmpegBinary(): Promise<string> {
  return new Promise((resolve, reject) => {
    const platform = FFMPEG_PLATFORMS[process.platform]

    if (!platform) {
      reject(new Error(`Unsupported platform: ${process.platform}`))
      return
    }

    const binaryDir = getFFmpegBinaryDir()

    // Ensure directory exists
    if (!fs.existsSync(binaryDir)) {
      fs.mkdirSync(binaryDir, { recursive: true })
    }

    console.log(`Downloading FFmpeg binary for platform: ${platform}`)
    console.log(`Download directory: ${binaryDir}`)

    ffbinaries.downloadBinaries(
      ["ffmpeg"],
      {
        platform: platform,
        destination: binaryDir,
        quiet: false,
      },
      (err: Error | null, data: unknown) => {
        if (err) {
          console.error("FFmpeg download error:", err)
          reject(new Error(`Failed to download FFmpeg: ${err.message}`))
          return
        }

        console.log("FFmpeg download completed:", data)

        const binaryPath = getFFmpegBinaryPath()

        // Verify the download
        if (checkFFmpegBinaryExists()) {
          // Make executable on Unix systems
          if (process.platform !== "win32") {
            try {
              fs.chmodSync(binaryPath, "755")
            } catch (chmodError) {
              console.warn("Could not make FFmpeg executable:", chmodError)
            }
          }

          resolve(binaryPath)
        } else {
          reject(new Error("FFmpeg binary was not found after download"))
        }
      },
    )
  })
}

/**
 * Get FFmpeg binary info
 */
function getFFmpegBinaryInfo(): {
  exists: boolean
  path: string
  size?: number
} {
  const binaryPath = getFFmpegBinaryPath()
  const exists = checkFFmpegBinaryExists()

  let size: number | undefined
  if (exists) {
    try {
      const stats = fs.statSync(binaryPath)
      size = stats.size
    } catch (error) {
      console.error("Error getting FFmpeg binary size:", error)
    }
  }

  return {
    exists,
    path: binaryPath,
    size,
  }
}

/**
 * Delete FFmpeg binary
 */
function deleteFFmpegBinary(): boolean {
  const binaryPath = getFFmpegBinaryPath()

  try {
    if (fs.existsSync(binaryPath)) {
      fs.unlinkSync(binaryPath)
      console.log("FFmpeg binary deleted:", binaryPath)
      return true
    }
    return true // Already doesn't exist
  } catch (error) {
    console.error("Error deleting FFmpeg binary:", error)
    return false
  }
}

/**
 * Register FFmpeg binary management IPC handlers
 */
export default function registerFFmpegBinaryIPC() {
  ipcMain.removeHandler("ffmpeg:get-binary-info")
  ipcMain.removeHandler("ffmpeg:download-binary")
  ipcMain.removeHandler("ffmpeg:delete-binary")
  ipcMain.removeHandler("ffmpeg:check-binary-exists")

  ipcMain.handle("ffmpeg:get-binary-info", () => {
    return getFFmpegBinaryInfo()
  })

  ipcMain.handle("ffmpeg:download-binary", async () => {
    try {
      const binaryPath = await downloadFFmpegBinary()
      return { success: true, path: binaryPath }
    } catch (error) {
      console.error("FFmpeg download failed:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: errorMessage }
    }
  })

  ipcMain.handle("ffmpeg:delete-binary", () => {
    const success = deleteFFmpegBinary()
    return { success }
  })

  ipcMain.handle("ffmpeg:check-binary-exists", () => {
    return checkFFmpegBinaryExists()
  })
}

// Export functions for use in other modules
export { checkFFmpegBinaryExists, getFFmpegBinaryPath }
