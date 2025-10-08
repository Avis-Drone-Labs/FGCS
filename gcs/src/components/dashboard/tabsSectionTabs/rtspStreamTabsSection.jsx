/**
 * This file contains components for displaying and managing RTSP video streams in a dedicated tab.
 */

// Native
import { useRef, useState } from "react"

// JSMpeg Player for ultra low-latency MPEG1 streaming
import JSMpeg from "@cycjimmy/jsmpeg-player"

// Mantine
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core"
import { useSessionStorage } from "@mantine/hooks"

// Helper
import {
  IconAlertCircle,
  IconExternalLink,
  IconTrash,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react"
import { showSuccessNotification } from "../../../helpers/notification"

export default function RTSPStreamTabsSection({ tabPadding }) {
  const [rtspStreams, setRtspStreams] = useSessionStorage({
    key: "rtspStreams",
    defaultValue: [],
  })

  const [newStreamUrl, setNewStreamUrl] = useState(
    "rtsp://192.168.144.25:8554/main.264",
  )
  const [newStreamName, setNewStreamName] = useState("test")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStreamId, setLoadingStreamId] = useState(null)
  const [error, setError] = useState("")

  const videoRefs = useRef({})

  const generateStreamId = () => Math.random().toString(36).slice(2, 11)

  const setupJSMpegPlayer = (videoWrapper, streamUrl, streamId, streamName) => {
    console.log(
      `Setting up JSMpeg ultra low-latency player for ${streamName} with URL: ${streamUrl}`,
    )

    // Clean up any existing JSMpeg player for this stream
    if (videoRefs.current[streamId]) {
      try {
        if (typeof videoRefs.current[streamId].destroy === "function") {
          videoRefs.current[streamId].destroy()
        }
      } catch (error) {
        console.warn("Error destroying previous JSMpeg player:", error)
      }
    }

    try {
      const player = new JSMpeg.VideoElement(videoWrapper, streamUrl, {
        poster: "", // No poster image
        autoplay: true,
        audio: false, // No audio needed
        loop: false,
        videoBufferSize: 512 * 1024, // 512KB buffer (very small for low latency)
        pauseWhenHidden: false, // Keep playing when tab is not visible
        disableGl: false, // Use WebGL for better performance
        preserveDrawingBuffer: false,
        progressive: true, // Enable progressive decoding
        throttled: false, // Don't throttle to reduce latency
        chunkSize: 1024 * 4, // Small chunk size for lower latency
        videoDecodeChunkSize: 512 * 1024, // Video decode chunk size,
        hooks: {
          load: () => {
            console.log(`Loading started for ${streamName}`)
          },
          play: () => {
            console.log(`Playback started for ${streamName}`)
          },
          stop: () => {
            console.log(`Playback stopped for ${streamName}`)
          },
          pause: () => {
            console.log(`Playback paused for ${streamName}`)
          },
        },
      })

      videoRefs.current[streamId] = player

      console.log(`JSMpeg player initialized for ${streamName}`)
    } catch (error) {
      console.error("Error setting up JSMpeg player:", error)
      setError(
        `Failed to setup JSMpeg player for ${streamName}: ${error.message}`,
      )
    }
  }

  const validateRtspUrl = (url) => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.protocol === "rtsp:"
    } catch {
      return false
    }
  }

  const addStream = () => {
    if (!newStreamUrl.trim()) {
      setError("Please enter an RTSP URL")
      return
    }

    if (!validateRtspUrl(newStreamUrl.trim())) {
      setError(
        "Please enter a valid RTSP URL (e.g., rtsp://192.168.1.100:554/stream)",
      )
      return
    }

    if (!newStreamName.trim()) {
      setError("Please enter a stream name")
      return
    }

    const newStream = {
      id: generateStreamId(),
      url: newStreamUrl.trim(),
      name: newStreamName.trim(),
      status: "stopped",
    }

    setRtspStreams([...rtspStreams, newStream])
    setNewStreamUrl("")
    setNewStreamName("")
    setError("")
  }

  const removeStream = (streamId) => {
    // Clean up JSMpeg player ref
    if (videoRefs.current[streamId]) {
      if (typeof videoRefs.current[streamId].destroy === "function") {
        videoRefs.current[streamId].destroy()
      }
      delete videoRefs.current[streamId]
    }

    setRtspStreams(rtspStreams.filter((stream) => stream.id !== streamId))
  }

  const startStream = async (stream) => {
    setIsLoading(true)
    setLoadingStreamId(stream.id)
    setError("")

    try {
      const streamUrl = await window.ipcRenderer.invoke(
        "app:start-rtsp-stream",
        stream.url,
      )

      if (streamUrl) {
        // Update stream status
        setRtspStreams((streams) =>
          streams.map((s) =>
            s.id === stream.id
              ? { ...s, status: "playing", convertedUrl: streamUrl }
              : s,
          ),
        )

        // Show success notification
        showSuccessNotification(`Stream "${stream.name}" started successfully!`)

        // Set up JSMpeg video player
        setTimeout(() => {
          const videoWrapper = videoRefs.current[stream.id]
          if (videoWrapper) {
            setupJSMpegPlayer(videoWrapper, streamUrl, stream.id, stream.name)
          }
        }, 1000) // JSMpeg connects much faster than HLS
      } else {
        setError(
          "Failed to start RTSP stream conversion. Check the console for details and ensure FFmpeg is installed in Settings → FGCS.",
        )
      }
    } catch (error) {
      console.error("Error starting RTSP stream:", error)

      // Provide more specific error messages
      let errorMessage = "Failed to start stream"
      if (error.message?.includes("FFmpeg binary not found")) {
        errorMessage =
          "FFmpeg not found. Please download FFmpeg from Settings → FGCS tab."
      } else if (error.message?.includes("Connection refused")) {
        errorMessage =
          "Cannot connect to RTSP stream. Check the URL and network connectivity."
      } else if (error.message?.includes("Invalid")) {
        errorMessage =
          "Invalid RTSP stream format. Please check the stream URL."
      } else if (error.message) {
        errorMessage = `Failed to start stream: ${error.message}`
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setLoadingStreamId(null)
    }
  }

  const testConnection = async (url) => {
    if (!url.trim()) {
      setError("Please enter an RTSP URL to test")
      return
    }

    if (!validateRtspUrl(url.trim())) {
      setError("Please enter a valid RTSP URL")
      return
    }

    setIsLoading(true)
    setLoadingStreamId("test")
    setError("")

    try {
      const result = await window.ipcRenderer.invoke(
        "app:test-rtsp-connection",
        url.trim(),
      )

      if (result.success) {
        setError("") // Clear any existing errors
        showSuccessNotification(
          "RTSP connection test successful! The stream is accessible.",
        )
        console.log("RTSP connection test successful")
      } else {
        setError(`Connection test failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error testing RTSP connection:", error)
      setError(`Connection test failed: ${error.message}`)
    } finally {
      setIsLoading(false)
      setLoadingStreamId(null)
    }
  }

  const stopStream = async (stream) => {
    try {
      await window.ipcRenderer.invoke("app:stop-rtsp-stream", stream.url)

      // Update stream status
      setRtspStreams((streams) =>
        streams.map((s) =>
          s.id === stream.id
            ? { ...s, status: "stopped", convertedUrl: null }
            : s,
        ),
      )

      // Stop JSMpeg player
      const jsmpegPlayer = videoRefs.current[stream.id]
      if (jsmpegPlayer && typeof jsmpegPlayer.destroy === "function") {
        jsmpegPlayer.destroy()
        delete videoRefs.current[stream.id]
      }
    } catch (error) {
      console.error("Error stopping RTSP stream:", error)
      setError(`Failed to stop stream: ${error.message}`)
    }
  }

  const openStreamPopout = (stream) => {
    if (stream.status === "playing") {
      window.ipcRenderer.invoke(
        "app:open-webcam-window",
        stream.convertedUrl || stream.url,
        stream.name,
        16 / 9, // Default aspect ratio
        "rtsp",
      )
    }
  }

  return (
    <Tabs.Panel value="rtsp-streams">
      <div className={`flex flex-col gap-4 ${tabPadding}`}>
        {/* Add New Stream Section */}
        <Card className="bg-falcongrey-800 border border-falcongrey-700">
          <Stack spacing="sm">
            <Text size="sm" weight={500} className="text-slate-200">
              Add RTSP Stream
            </Text>

            <TextInput
              placeholder="Stream name (e.g., Front Camera)"
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.currentTarget.value)}
              label="Stream Name"
            />

            <TextInput
              placeholder="rtsp://192.168.1.100:554/stream"
              value={newStreamUrl}
              onChange={(e) => setNewStreamUrl(e.currentTarget.value)}
              label="RTSP URL"
            />

            <Group spacing="sm">
              <Button
                onClick={() => testConnection(newStreamUrl)}
                color="orange"
                size="sm"
                variant="outline"
                disabled={!newStreamUrl.trim() || isLoading}
                loading={isLoading && loadingStreamId === "test"}
              >
                Test Connection
              </Button>
              <Button
                onClick={addStream}
                color="blue"
                size="sm"
                disabled={!newStreamUrl.trim() || !newStreamName.trim()}
              >
                Add Stream
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            onClose={() => setError("")}
            withCloseButton
          >
            <div>
              <Text size="sm" weight={500} className="mb-2">
                {error}
              </Text>
              <Text size="xs" className="text-slate-300">
                <strong>Troubleshooting tips:</strong>
                <br />• Ensure FFmpeg is downloaded in Settings → FGCS tab
                <br />• Verify RTSP URL is correct and accessible
                <br />• Check network connectivity to the camera/server
                <br />• Try using TCP transport if UDP fails
              </Text>
            </div>
          </Alert>
        )}

        {/* Streams List */}
        {rtspStreams.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <IconVideo size={48} className="mx-auto mb-4 opacity-50" />
            <Text>No RTSP streams configured</Text>
            <Text size="sm">Add a stream above to get started</Text>
          </div>
        ) : (
          <Stack spacing="md">
            {rtspStreams.map((stream) => (
              <Card
                key={stream.id}
                className="bg-falcongrey-800 border border-falcongrey-700"
              >
                <Group position="apart" className="mb-3">
                  <div>
                    <Text weight={500} className="text-slate-200">
                      {stream.name}
                    </Text>
                    <Text size="xs" className="text-slate-400 font-mono">
                      {stream.url}
                    </Text>
                    {stream.status === "playing" && (
                      <Text size="xs" className="text-green-400 mt-1">
                        🟢 Streaming active
                      </Text>
                    )}
                  </div>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeStream(stream.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                {stream.status === "playing" ? (
                  <div className="relative mb-3">
                    <div
                      ref={(el) => {
                        if (el) videoRefs.current[stream.id] = el
                      }}
                      className="w-full h-48 bg-black rounded overflow-hidden"
                      style={{ width: "100%", height: "192px" }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-slate-300">
                      LIVE - JSMpeg Ultra Low Latency
                    </div>
                    <button
                      className="absolute top-2 right-2 bg-falcongrey-900/60 p-1 rounded-[0.2em]"
                      onClick={() => openStreamPopout(stream)}
                    >
                      <IconExternalLink
                        stroke={2}
                        className="stroke-slate-200 size-5"
                      />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-falcongrey-900 rounded flex items-center justify-center mb-3">
                    {isLoading && loadingStreamId === stream.id ? (
                      <div className="flex flex-col items-center">
                        <Loader size="md" className="mb-2" />
                        <Text size="sm" className="text-slate-400">
                          Starting stream...
                        </Text>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <IconVideoOff
                          size={48}
                          className="text-slate-500 mb-2"
                        />
                        <Text size="sm" className="text-slate-400">
                          Stream stopped
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                <Group spacing="sm">
                  {stream.status === "playing" ? (
                    <Button
                      size="xs"
                      color="red"
                      onClick={() => stopStream(stream)}
                    >
                      Stop Stream
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      color="green"
                      onClick={() => startStream(stream)}
                      loading={isLoading && loadingStreamId === stream.id}
                    >
                      Start Stream
                    </Button>
                  )}

                  {stream.status === "playing" && (
                    <Button
                      size="xs"
                      variant="outline"
                      leftSection={<IconExternalLink size={14} />}
                      onClick={() => openStreamPopout(stream)}
                    >
                      Open in Window
                    </Button>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </div>
    </Tabs.Panel>
  )
}
