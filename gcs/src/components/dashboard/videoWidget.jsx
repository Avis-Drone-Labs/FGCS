/*
This component displays a video widget with low-latency streaming using JSMpeg or with React Webcam.
*/
import { useEffect, useRef, useState } from "react"

// JSMpeg Player for ultra low-latency MPEG1 streaming
import JSMpeg from "@cycjimmy/jsmpeg-player"

// Mantine
import { ActionIcon, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"

// Helper
import {
  IconAlertCircle,
  IconExternalLink,
  IconSettings,
  IconVideo,
} from "@tabler/icons-react"
import { useSelector } from "react-redux"
import { showSuccessNotification } from "../../helpers/notification"
import { selectVideoSource } from "../../redux/slices/droneConnectionSlice"
import VideoWidgetSourceSelectModal from "./videoWidgetSourceSelectModal"

export default function VideoWidget({ telemetryPanelWidth }) {
  const videoSource = useSelector(selectVideoSource)

  const [error, setError] = useState(null)

  const [
    sourceSelectModalOpened,
    { open: openStreamSelectModal, close: closeStreamSelectModal },
  ] = useDisclosure(false)

  const videoRef = useRef(null)
  const jsmpegPlayerRef = useRef(null)

  function destroyJSMpegPlayer() {
    if (jsmpegPlayerRef.current) {
      try {
        if (typeof jsmpegPlayerRef.current.destory === "function") {
          jsmpegPlayerRef.current.destory()
        }
        jsmpegPlayerRef.current = null
        setError(null)
      } catch (error) {
        console.warn("Error cleaning up previous JSMpeg player:", error)
        jsmpegPlayerRef.current = null
      }
    } else {
      setError(null)
    }
  }

  function setupJSMpegPlayer(videoWrapper, streamUrl, streamName) {
    destroyJSMpegPlayer()

    try {
      const player = new JSMpeg.VideoElement(videoWrapper, streamUrl, {
        poster: "", // TODO: add a poster image
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
        videoDecodeChunkSize: 512 * 1024, // Video decode chunk size
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

      jsmpegPlayerRef.current = player
    } catch (error) {
      console.error("Error setting up JSMpeg player:", error)
      setError(
        `Failed to setup JSMpeg player for ${streamName}: ${error.message}`,
      )
    }
  }

  async function startStream(stream) {
    setError(null)

    try {
      destroyJSMpegPlayer()

      const streamUrl = await window.ipcRenderer.invoke(
        "app:start-rtsp-stream",
        stream.url,
      )

      if (streamUrl) {
        showSuccessNotification(`Stream "${stream.name}" started successfully!`)

        // Set up JSMpeg video player
        const videoWrapper = videoRef.current
        if (videoWrapper) {
          setupJSMpegPlayer(videoWrapper, streamUrl, stream.name)
        }
      } else {
        setError(
          "Failed to start RTSP stream conversion. Check the console for details and ensure FFmpeg is installed in settings.",
        )
      }
    } catch (error) {
      console.error("Error starting RTSP stream:", error)

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
    }
  }

  async function stopStream() {
    try {
      await window.ipcRenderer.invoke("app:stop-rtsp-stream")
      destroyJSMpegPlayer()
    } catch (error) {
      console.error("Error stopping RTSP stream:", error)
      setError(`Failed to stop stream: ${error.message}`)
    }
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      destroyJSMpegPlayer()
    }
  }, [])

  useEffect(() => {
    async function handleVideoSourceChange() {
      if (videoSource === null) {
        // If no video source is selected, clean up any existing JSMpeg player
        await stopStream()
      } else if (videoSource.type === "stream") {
        await startStream(videoSource)
      } else if (videoSource.type === "webcam") {
        await stopStream()
        // TODO: Add webcam handling
      }
    }

    handleVideoSourceChange()
  }, [videoSource])

  return (
    <>
      <VideoWidgetSourceSelectModal
        opened={sourceSelectModalOpened}
        onClose={closeStreamSelectModal}
      />

      <div
        className="absolute bottom-4 w-80 bg-falcongrey-900/95 border border-falcongrey-700 rounded-lg shadow-lg backdrop-blur-sm z-10"
        style={{ left: `${telemetryPanelWidth + 16}px` }}
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <Text>{videoSource?.name}</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={openStreamSelectModal}
              className="text-slate-400 hover:text-slate-200"
            >
              <IconSettings size={16} />
            </ActionIcon>
          </div>

          <div>
            {videoSource && error === null ? (
              <div className="relative">
                <div
                  ref={videoRef}
                  className="w-full h-32 bg-black rounded overflow-hidden"
                  style={{ width: "100%", height: "128px" }}
                />
                <button
                  className="absolute top-1 right-1 bg-black/60 p-1 rounded z-10"
                  // onClick={() => openStreamPopout(selectedStream)}
                >
                  <IconExternalLink size={14} className="text-slate-200" />
                </button>
              </div>
            ) : (
              <div className="w-full h-32 bg-falcongrey-800 rounded flex flex-col items-center justify-center text-center">
                {error === null ? (
                  <>
                    <IconVideo size={24} className="text-slate-500 mb-1" />
                    <Text size="sm">No stream selected</Text>
                  </>
                ) : (
                  <>
                    <IconAlertCircle
                      size={24}
                      className="text-falconred mb-1"
                    />
                    <Text size="sm">{error}</Text>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
