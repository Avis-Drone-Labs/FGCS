import { ChildProcess, spawn } from "child_process"
import { ipcMain } from "electron"
import fs from "fs"
import { createServer, Server } from "http"
import path from "path"
import { checkFFmpegBinaryExists, getFFmpegBinaryPath } from "./ffmpegBinary"

interface RTSPStream {
  rtspUrl: string
  ffmpegProcess: ChildProcess | null
  hlsServer: Server | null
  hlsPort: number
  playlistPath: string
}

const activeStreams = new Map<string, RTSPStream>()
const HLS_BASE_PORT = 8080

/**
 * Start converting an RTSP stream to HLS for browser consumption
 * @param rtspUrl The RTSP stream URL to convert
 * @returns Promise<string> The local HLS stream URL that can be played in a browser
 */
async function startRTSPStream(rtspUrl: string): Promise<string> {
  // Check if FFmpeg binary exists
  if (!checkFFmpegBinaryExists()) {
    throw new Error(
      "FFmpeg binary not found. Please download FFmpeg from the settings.",
    )
  }

  const streamId = Buffer.from(rtspUrl).toString("base64")

  if (activeStreams.has(streamId)) {
    const stream = activeStreams.get(streamId)!
    return `http://localhost:${stream.hlsPort}/playlist.m3u8`
  }

  // Find available port
  const hlsPort = await findAvailablePort(HLS_BASE_PORT)

  // Create temporary directory for HLS files
  const tempDir = path.join(process.env.TEMP || "/tmp", `rtsp_${streamId}`)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const playlistPath = path.join(tempDir, "playlist.m3u8")
  const ffmpegPath = getFFmpegBinaryPath()

  try {
    // Start FFmpeg process to convert RTSP to HLS
    const ffmpegProcess = spawn(ffmpegPath, [
      "-i",
      rtspUrl,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "3",
      "-hls_flags",
      "delete_segments",
      "-y",
      playlistPath,
    ])

    ffmpegProcess.on("error", (error) => {
      console.error("FFmpeg process error:", error)
      stopRTSPStream(rtspUrl)
    })

    ffmpegProcess.on("exit", (code) => {
      console.log(`FFmpeg process exited with code ${code}`)
      if (code !== 0) {
        stopRTSPStream(rtspUrl)
      }
    })

    // Create HTTP server to serve HLS files
    const hlsServer = createServer((req, res) => {
      const filePath = path.join(tempDir, path.basename(req.url || ""))

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath)
        let contentType = "text/plain"

        if (ext === ".m3u8") {
          contentType = "application/vnd.apple.mpegurl"
        } else if (ext === ".ts") {
          contentType = "video/mp2t"
        }

        res.setHeader("Content-Type", contentType)
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Headers", "*")

        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
      } else {
        res.statusCode = 404
        res.end("File not found")
      }
    })

    await new Promise<void>((resolve, reject) => {
      hlsServer.listen(hlsPort, (err?: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const streamInfo: RTSPStream = {
      rtspUrl,
      ffmpegProcess,
      hlsServer,
      hlsPort,
      playlistPath: tempDir,
    }

    activeStreams.set(streamId, streamInfo)

    // Wait a bit for the playlist to be generated
    await new Promise((resolve) => setTimeout(resolve, 3000))

    return `http://localhost:${hlsPort}/playlist.m3u8`
  } catch (error) {
    console.error("Error starting RTSP stream:", error)
    throw new Error("Failed to start RTSP stream conversion")
  }
}

/**
 * Stop and cleanup an RTSP stream conversion
 * @param rtspUrl The RTSP stream URL to stop
 */
function stopRTSPStream(rtspUrl: string): void {
  const streamId = Buffer.from(rtspUrl).toString("base64")
  const stream = activeStreams.get(streamId)

  if (stream) {
    // Kill FFmpeg process
    if (stream.ffmpegProcess) {
      stream.ffmpegProcess.kill()
    }

    // Close HLS server
    if (stream.hlsServer) {
      stream.hlsServer.close()
    }

    // Cleanup temporary files
    try {
      if (fs.existsSync(stream.playlistPath)) {
        fs.rmSync(stream.playlistPath, { recursive: true, force: true })
      }
    } catch (error) {
      console.error("Error cleaning up HLS files:", error)
    }

    activeStreams.delete(streamId)
  }
}

/**
 * Find an available port starting from the base port
 */
async function findAvailablePort(basePort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(basePort, () => {
      const address = server.address()
      const port =
        typeof address === "object" && address !== null
          ? address.port
          : basePort
      server.close(() => resolve(port))
    })
    server.on("error", () => {
      resolve(findAvailablePort(basePort + 1))
    })
  })
}

/**
 * Cleanup all active streams
 */
export function cleanupAllRTSPStreams(): void {
  for (const [, stream] of activeStreams) {
    stopRTSPStream(stream.rtspUrl)
  }
  activeStreams.clear()
}

/**
 * Register RTSP stream IPC handlers
 */
export default function registerRTSPStreamIPC() {
  ipcMain.removeHandler("app:start-rtsp-stream")
  ipcMain.removeHandler("app:stop-rtsp-stream")

  ipcMain.handle("app:start-rtsp-stream", async (_, rtspUrl: string) => {
    try {
      return await startRTSPStream(rtspUrl)
    } catch (error) {
      console.error("Failed to start RTSP stream:", error)
      return null
    }
  })

  ipcMain.handle("app:stop-rtsp-stream", (_, rtspUrl: string) => {
    stopRTSPStream(rtspUrl)
  })
}
