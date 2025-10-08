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

const activeStreams = new Map<string, RTSPStream>()
const WEBSOCKET_BASE_PORT = 8080

/**
 * Start converting an RTSP stream to MPEG1 for JSMpeg browser consumption
 * @param rtspUrl The RTSP stream URL to convert
 * @returns Promise<string> The WebSocket URL that can be used by JSMpeg player
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
    return `ws://localhost:${stream.port}/stream`
  }

  // Find available port
  const port = await findAvailablePort(WEBSOCKET_BASE_PORT)

  const ffmpegPath = getFFmpegBinaryPath()

  try {
    // Verify FFmpeg binary exists and is executable
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

      // Filter out progress messages, HLS segment creation messages, and version banner
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

      // Look for common error patterns
      if (
        output.includes("Connection refused") ||
        output.includes("No route to host")
      ) {
        console.error("Network connectivity issue with RTSP stream")
      } else if (output.includes("Invalid data found when processing input")) {
        console.error("Invalid RTSP stream format")
      } else if (output.includes("Permission denied")) {
        console.error("Permission denied accessing RTSP stream")
      } else if (output.includes("Stream mapping:")) {
        console.log("✅ FFmpeg successfully connected to RTSP stream")
      } else if (output.includes("Video:") || output.includes("Audio:")) {
        console.log("📺 Stream info:", output.trim())
      }
    })

    ffmpegProcess.on("error", (error) => {
      console.error("FFmpeg process spawn error:", error)
      stopRTSPStream(rtspUrl)
    })

    ffmpegProcess.on("exit", (code, signal) => {
      console.log(`FFmpeg process exited with code ${code}, signal ${signal}`)

      if (code !== 0) {
        console.error(`FFmpeg failed with exit code: ${code}`)

        // Common exit code meanings
        const errorMessages: Record<number, string> = {
          1: "FFmpeg general error",
          2: "FFmpeg invalid argument",
          126: "FFmpeg binary not executable",
          127: "FFmpeg binary not found",
          134: "FFmpeg aborted (SIGABRT)",
          139: "FFmpeg segmentation fault (SIGSEGV)",
        }

        const errorMsg =
          (code !== null && errorMessages[code]) ||
          `FFmpeg unknown error (code: ${code})`
        console.error(`Error details: ${errorMsg}`)

        stopRTSPStream(rtspUrl)
      }
    })

    // Create HTTP server and WebSocket server for JSMpeg streaming
    const httpServer = createServer()
    const wsServer = new WebSocket.Server({ server: httpServer })

    // Store connected WebSocket clients
    const clients: Set<WebSocket> = new Set()

    wsServer.on("connection", (client: WebSocket) => {
      console.log("JSMpeg client connected")
      clients.add(client)

      client.on("close", () => {
        console.log("JSMpeg client disconnected")
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

    activeStreams.set(streamId, streamInfo)

    // Return the WebSocket URL for JSMpeg
    return `ws://localhost:${port}`
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

    // Close WebSocket server
    if (stream.wsServer) {
      stream.wsServer.close()
    }

    // Close HTTP server
    if (stream.httpServer) {
      stream.httpServer.close()
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
 * Test RTSP connection without starting full conversion
 */
async function testRTSPConnection(
  rtspUrl: string,
): Promise<{ success: boolean; error?: string }> {
  if (!checkFFmpegBinaryExists()) {
    return {
      success: false,
      error:
        "FFmpeg binary not found. Please download FFmpeg from the settings.",
    }
  }

  const ffmpegPath = getFFmpegBinaryPath()

  return new Promise((resolve) => {
    console.log(`Testing RTSP connection: ${rtspUrl}`)

    // Use FFmpeg to test the stream for 5 seconds
    const testProcess = spawn(
      ffmpegPath,
      [
        "-rtsp_transport",
        "tcp",
        "-i",
        rtspUrl,
        "-t",
        "5", // Test for 5 seconds
        "-f",
        "null", // Discard output
        "-",
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    )

    let errorOutput = ""
    let hasConnected = false

    testProcess.stderr?.on("data", (data) => {
      const output = data.toString()
      errorOutput += output

      // Look for signs of successful connection
      if (
        output.includes("Stream mapping:") ||
        output.includes("Video:") ||
        output.includes("Audio:")
      ) {
        hasConnected = true
      }
    })

    testProcess.on("exit", (code) => {
      if (hasConnected || code === 0) {
        resolve({ success: true })
      } else {
        let errorMessage = "Connection test failed"

        if (errorOutput.includes("Connection refused")) {
          errorMessage =
            "Connection refused - check if the RTSP server is running"
        } else if (errorOutput.includes("No route to host")) {
          errorMessage = "No route to host - check network connectivity"
        } else if (errorOutput.includes("Invalid data")) {
          errorMessage = "Invalid stream format - check RTSP URL"
        } else if (errorOutput.includes("Unauthorized")) {
          errorMessage = "Authentication failed - check username/password"
        } else if (errorOutput.includes("Not found")) {
          errorMessage = "Stream not found - check RTSP path"
        }

        resolve({ success: false, error: errorMessage })
      }
    })

    testProcess.on("error", (error) => {
      resolve({ success: false, error: `Process error: ${error.message}` })
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      testProcess.kill()
      if (!hasConnected) {
        resolve({
          success: false,
          error: "Connection timeout - stream may be unreachable",
        })
      }
    }, 10000)
  })
}

/**
 * Register RTSP stream IPC handlers
 */
export default function registerRTSPStreamIPC() {
  ipcMain.removeHandler("app:start-rtsp-stream")
  ipcMain.removeHandler("app:stop-rtsp-stream")
  ipcMain.removeHandler("app:test-rtsp-connection")

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

  ipcMain.handle("app:test-rtsp-connection", async (_, rtspUrl: string) => {
    try {
      return await testRTSPConnection(rtspUrl)
    } catch (error) {
      console.error("Failed to test RTSP connection:", error)
      return { success: false, error: "Test failed with unknown error" }
    }
  })
}
