import { ChildProcess, spawn } from "child_process"
import { ipcMain } from "electron"
import fs from "fs"
import { createServer, Server } from "http"
import { checkFFmpegBinaryExists, getFFmpegBinaryPath } from "./ffmpegBinary"

import WebSocket from "ws"

interface RTSPStream {
  rtspUrl: string
  ffmpegProcess: ChildProcess | null
  httpServer: Server | null
  wsServer: WebSocket.Server | null
  port: number
}

let activeStream: RTSPStream | null = null
const WEBSOCKET_BASE_PORT = 8080

async function startRTSPStream(rtspUrl: string): Promise<string> {
  if (!checkFFmpegBinaryExists()) {
    throw new Error(
      "FFmpeg binary not found. Please download FFmpeg from the settings.",
    )
  }

  // Stop any existing stream before starting a new one
  if (activeStream) {
    console.log("Stopping existing stream before starting new one")
    stopCurrentStream()
  }

  // If requesting the same stream that's already running, return its URL
  if (activeStream && activeStream.rtspUrl === rtspUrl) {
    return `ws://localhost:${activeStream.port}`
  }

  const port = await findAvailablePort(WEBSOCKET_BASE_PORT)

  const ffmpegPath = getFFmpegBinaryPath()

  try {
    if (!fs.existsSync(ffmpegPath)) {
      throw new Error(`FFmpeg binary not found at: ${ffmpegPath}`)
    }

    console.log(`Starting FFmpeg conversion for RTSP stream: ${rtspUrl}`)

    // Start FFmpeg process to convert RTSP to MPEG1 stream for JSMpeg (ultra low latency)
    const ffmpegArgs = [
      "-loglevel",
      "warning", // Only show warnings and errors, not info messages
      "-rtsp_transport",
      "tcp", // Use TCP for RTSP (more reliable)
      "-i",
      rtspUrl,
      "-an", // Disable audio completely
      "-c:v",
      "mpeg1video", // MPEG1 video codec (required for JSMpeg)
      "-b:v",
      "1M", // Video bitrate
      "-s",
      "1280x720", // Resolution (adjust as needed)
      "-r",
      "30", // Frame rate
      "-f",
      "mpegts", // MPEG Transport Stream format
      "-muxdelay",
      "0.1", // Minimize muxing delay
      "-reconnect",
      "1", // Reconnect on connection failure
      "-reconnect_at_eof",
      "1", // Reconnect at end of file
      "-reconnect_streamed",
      "1", // Reconnect for streamed content
      "-y", // Overwrite output files
      "pipe:1", // Output to stdout for WebSocket streaming
    ]

    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, {
      stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr
    })

    // Capture FFmpeg output for debugging
    // ffmpegProcess.stdout?.on("data", (_data) => {
    // Stream data is being piped to HTTP response, no need to log
    // })

    ffmpegProcess.stderr?.on("data", (data) => {
      const output = data.toString()

      // Filter out progress messages
      const isProgressMessage =
        output.includes("time=") &&
        output.includes("bitrate=") &&
        output.includes("speed=")
      const isHLSMessage =
        output.includes("Opening '") &&
        (output.includes(".ts") || output.includes(".m3u8"))
      const isVersionBanner =
        output.includes("ffmpeg version") ||
        output.includes("built with gcc") ||
        output.includes("configuration:") ||
        output.includes("libav") ||
        output.includes("libsw")

      // Only log important messages, not progress updates or version info
      if (!isProgressMessage && !isHLSMessage && !isVersionBanner) {
        console.log("FFmpeg stderr:", output)
      }

      // Look for common error patterns and throw detailed errors
      if (
        output.includes("Connection refused") ||
        output.includes("No route to host")
      ) {
        const errorMsg =
          "Network connectivity issue: Cannot connect to RTSP stream. Check the URL and network connectivity."
        console.error(errorMsg)
        throw new Error(errorMsg)
      } else if (output.includes("Invalid data found when processing input")) {
        const errorMsg =
          "Invalid RTSP stream format: The stream format is not supported or the URL is incorrect."
        console.error(errorMsg)
        throw new Error(errorMsg)
      } else if (output.includes("Permission denied")) {
        const errorMsg =
          "Permission denied: Access to the RTSP stream is restricted. Check authentication credentials."
        console.error(errorMsg)
        throw new Error(errorMsg)
      } else if (output.includes("No such file or directory")) {
        const errorMsg =
          "RTSP stream not found: The specified stream URL does not exist or is not accessible."
        console.error(errorMsg)
        throw new Error(errorMsg)
      } else if (output.includes("Immediate exit requested")) {
        const errorMsg = "FFmpeg was terminated unexpectedly."
        console.error(errorMsg)
        throw new Error(errorMsg)
      } else if (output.includes("Stream mapping:")) {
        console.log("FFmpeg successfully connected to RTSP stream")
      } else if (output.includes("Video:") || output.includes("Audio:")) {
        console.log("Stream info:", output.trim())
      }
    })

    ffmpegProcess.on("error", (error) => {
      console.error("FFmpeg process spawn error:", error)
      stopCurrentStream()
      throw new Error(`FFmpeg process failed to start: ${error.message}`)
    })

    ffmpegProcess.on("exit", (code, signal) => {
      console.log(`FFmpeg process exited with code ${code}, signal ${signal}`)

      if (code === null && signal === "SIGTERM") {
        return
      }

      if (code !== 0) {
        console.error(`FFmpeg failed with exit code: ${code}`)

        // Common exit code meanings with detailed descriptions
        const errorMessages: Record<number, string> = {
          1: "FFmpeg general error: Stream processing failed. Check the RTSP URL and stream format.",
          2: "FFmpeg invalid argument: Invalid parameters provided to FFmpeg. This may indicate a configuration issue.",
          126: "FFmpeg binary not executable: The FFmpeg binary does not have execute permissions.",
          127: "FFmpeg binary not found: FFmpeg binary is missing or not in the expected location.",
          134: "FFmpeg aborted (SIGABRT): FFmpeg was aborted, possibly due to memory issues or invalid input.",
          139: "FFmpeg segmentation fault (SIGSEGV): FFmpeg crashed due to a memory access violation.",
          4294967274:
            "FFmpeg error opening stream: The RTSP stream could not be opened. Check the URL and network connectivity.",
        }

        const errorMsg =
          (code !== null && errorMessages[code]) ||
          `FFmpeg process failed with unknown exit code: ${code}. This typically indicates a stream processing error.`
        console.error(`Error details: ${errorMsg}`)

        stopCurrentStream()
        throw new Error(errorMsg)
      }
    })

    // Create HTTP server and WebSocket server for JSMpeg streaming
    const httpServer = createServer()
    const wsServer = new WebSocket.Server({ server: httpServer })

    // Store connected WebSocket clients
    const clients: Set<WebSocket> = new Set()

    wsServer.on("connection", (client: WebSocket) => {
      clients.add(client)

      client.on("close", () => {
        clients.delete(client)
      })

      client.on("error", (error: Error) => {
        console.error("WebSocket error:", error)
        clients.delete(client)
      })
    })

    // Pipe FFmpeg output to all connected WebSocket clients
    if (ffmpegProcess.stdout) {
      ffmpegProcess.stdout.on("data", (data) => {
        // Broadcast MPEG1 data to all connected JSMpeg clients
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data)
          }
        })
      })
    }

    await new Promise<void>((resolve, reject) => {
      httpServer.listen(port, (err?: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const streamInfo: RTSPStream = {
      rtspUrl,
      ffmpegProcess,
      httpServer,
      wsServer,
      port,
    }

    activeStream = streamInfo

    return `ws://localhost:${port}`
  } catch (error) {
    console.error("Error starting RTSP stream:", error)
    throw new Error("Failed to start RTSP stream conversion")
  }
}

function stopCurrentStream(): void {
  if (activeStream) {
    console.log(`Stopping RTSP stream: ${activeStream.rtspUrl}`)

    // Kill FFmpeg process
    if (activeStream.ffmpegProcess) {
      activeStream.ffmpegProcess.kill()
    }

    // Close WebSocket server
    if (activeStream.wsServer) {
      activeStream.wsServer.close()
    }

    // Close HTTP server
    if (activeStream.httpServer) {
      activeStream.httpServer.close()
    }

    activeStream = null
  }
}

async function findAvailablePort(basePort: number): Promise<number> {
  // Find an available port starting from the base port
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

function getCurrentStreamUrl(): string | null {
  if (activeStream) {
    return `ws://localhost:${activeStream.port}/`
  }
  return null
}

export function cleanupAllRTSPStreams(): void {
  stopCurrentStream()
}

export default function registerRTSPStreamIPC() {
  ipcMain.removeHandler("app:start-rtsp-stream")
  ipcMain.removeHandler("app:stop-rtsp-stream")
  ipcMain.removeHandler("app:get-current-stream-url")

  ipcMain.handle("app:start-rtsp-stream", async (_, rtspUrl: string) => {
    try {
      return { success: true, streamUrl: await startRTSPStream(rtspUrl) }
    } catch (error) {
      console.error("Failed to start RTSP stream:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  })

  ipcMain.handle("app:stop-rtsp-stream", () => {
    stopCurrentStream()
  })

  ipcMain.handle("app:get-current-stream-url", () => {
    return getCurrentStreamUrl()
  })
}
