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
  IconResize,
  IconSettings,
  IconVideo,
} from "@tabler/icons-react"
import { useSelector } from "react-redux"
import Webcam from "react-webcam"
import GetOutsideVisibilityColor from "../../helpers/outsideVisibility"
import { selectVideoSource } from "../../redux/slices/droneConnectionSlice"
import VideoWidgetSourceSelectModal from "./videoWidgetSourceSelectModal"

export default function VideoWidget({ telemetryPanelWidth }) {
  const videoSource = useSelector(selectVideoSource)

  const [error, setError] = useState(null)
  const [videoDimensions, setVideoDimensions] = useState({
    width: 350,
    height: 197,
  }) // Default 16:9 aspect ratio
  const [baseAspectRatio, setBaseAspectRatio] = useState(16 / 9) // Track original aspect ratio
  const [scale, setScale] = useState(1) // Scale factor for resizing
  const [isPoppedOut, setIsPoppedOut] = useState(false) // Track if video is popped out

  const [
    sourceSelectModalOpened,
    { open: openStreamSelectModal, close: closeStreamSelectModal },
  ] = useDisclosure(false)

  const videoRef = useRef(null)
  const jsmpegPlayerRef = useRef(null)

  function updateScale(newScale) {
    const clampedScale = Math.max(1, Math.min(3, newScale)) // Clamp between 1x and 3x
    setScale(clampedScale)

    // Recalculate dimensions based on new scale
    const baseWidth = 350
    const newWidth = baseWidth * clampedScale
    const newHeight = Math.round(newWidth / baseAspectRatio)

    setVideoDimensions({
      width: newWidth,
      height: newHeight,
    })
  }

  function handleResizeStart(e) {
    const startX = e.clientX
    const startScale = scale

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX
      const scaleChange = deltaX / 200 // Adjust sensitivity
      const newScale = startScale + scaleChange
      updateScale(newScale)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  async function handlePopoutVideo() {
    if (!videoSource) return

    try {
      if (videoSource.type === "stream") {
        // For RTSP streams, we need to get the current stream URL
        const streamUrl = await window.ipcRenderer.invoke(
          "app:get-current-stream-url",
        )
        await window.ipcRenderer.invoke(
          "app:open-video-window",
          "stream",
          videoSource.id || "",
          videoSource.name,
          baseAspectRatio,
          streamUrl,
        )
      } else {
        // For webcam
        await window.ipcRenderer.invoke(
          "app:open-video-window",
          "webcam",
          videoSource.deviceId,
          videoSource.name,
          baseAspectRatio,
          "",
        )
      }

      setIsPoppedOut(true)
    } catch (error) {
      console.error("Error opening video popout:", error)
      setError(`Failed to pop out video: ${error.message}`)
    }
  }

  function destroyJSMpegPlayer() {
    if (jsmpegPlayerRef.current) {
      try {
        if (typeof jsmpegPlayerRef.current.destroy === "function") {
          jsmpegPlayerRef.current.destroy()
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
            // Get video dimensions when playback starts
            setTimeout(() => {
              if (player && player.canvas) {
                const canvas = player.canvas
                const videoWidth = canvas.width || 350
                const videoHeight = canvas.height || 197

                // Calculate dimensions with 350px base width
                const aspectRatio = videoWidth / videoHeight
                const displayWidth = 350 * scale
                const displayHeight = Math.round(displayWidth / aspectRatio)

                setBaseAspectRatio(aspectRatio)
                setVideoDimensions({
                  width: displayWidth,
                  height: displayHeight,
                })
              }
            }, 500) // Small delay to ensure canvas is ready
          },
          stop: () => {
            console.log(`Playback stopped for ${streamName}`)
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

      const response = await window.ipcRenderer.invoke(
        "app:start-rtsp-stream",
        stream.url,
      )

      if (response && response.success) {
        // Set up JSMpeg video player
        const videoWrapper = videoRef.current
        if (videoWrapper) {
          setupJSMpegPlayer(videoWrapper, response.streamUrl, stream.name)
        }
      } else {
        // Display the detailed error message from FFmpeg
        const errorMessage =
          response?.error ||
          "Failed to start RTSP stream conversion. Check the console for details and ensure FFmpeg is installed in settings."
        setError(errorMessage)
      }
    } catch (error) {
      console.error("Error starting RTSP stream:", error)
      setError(`Unexpected error: ${error.message || "Unknown error occurred"}`)
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
    // Listen for video window close events
    const handleVideoWindowClose = () => {
      setIsPoppedOut(false)
    }

    window.ipcRenderer.on("app:video-closed", handleVideoWindowClose)

    // Cleanup on unmount
    return () => {
      destroyJSMpegPlayer()
      window.ipcRenderer.removeAllListeners("app:video-closed")
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
        className={`absolute bottom-4 min-w-[350px] border border-falcongrey-700 rounded-lg shadow-lg backdrop-blur-sm z-10 ${isPoppedOut ? "hidden" : ""}`}
        style={{
          left: `${telemetryPanelWidth + 16}px`,
          background: GetOutsideVisibilityColor(),
        }}
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <Text>{videoSource?.name}</Text>
            <div className="flex items-center gap-1">
              {videoSource && error === null && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={handlePopoutVideo}
                  className="text-slate-400 hover:text-slate-200"
                  title="Pop out video"
                >
                  <IconExternalLink size={16} />
                </ActionIcon>
              )}
              <ActionIcon
                size="sm"
                variant="subtle"
                onMouseDown={handleResizeStart}
                className={`text-slate-400 hover:text-slate-200 hover:cursor-ne-resize`}
                title="Drag to resize"
              >
                <IconResize size={16} />
              </ActionIcon>

              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={openStreamSelectModal}
                className="text-slate-400 hover:text-slate-200"
              >
                <IconSettings size={16} />
              </ActionIcon>
            </div>
          </div>

          <div>
            {videoSource && error === null ? (
              <>
                {videoSource.type === "stream" ? (
                  <StreamDisplay
                    videoRef={videoRef}
                    dimensions={videoDimensions}
                  />
                ) : (
                  <WebcamDisplay
                    videoRef={videoRef}
                    deviceId={videoSource.deviceId}
                    dimensions={videoDimensions}
                    onDimensionsChange={setVideoDimensions}
                    onAspectRatioChange={setBaseAspectRatio}
                    scale={scale}
                  />
                )}
              </>
            ) : (
              <div
                className=" rounded flex flex-col items-center justify-center text-center mx-auto"
                style={{
                  width: `${videoDimensions.width}px`,
                  height: `${videoDimensions.height}px`,
                  minHeight: "128px", // Ensure minimum height for readability
                }}
              >
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
                    <Text size="sm" className="px-2">
                      {error}
                    </Text>
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

function StreamDisplay({ videoRef, dimensions }) {
  return (
    <div className="relative">
      <div
        ref={videoRef}
        className="bg-black rounded overflow-hidden mx-auto"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />
    </div>
  )
}

function WebcamDisplay({
  videoRef,
  deviceId,
  dimensions,
  onDimensionsChange,
  onAspectRatioChange,
  scale,
}) {
  const handleUserMedia = (stream) => {
    // Get actual video track dimensions
    if (stream && onDimensionsChange && onAspectRatioChange) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        if (settings.width && settings.height) {
          const aspectRatio = settings.width / settings.height
          const displayWidth = 350 * (scale || 1)
          const displayHeight = Math.round(displayWidth / aspectRatio)

          onAspectRatioChange(aspectRatio)
          onDimensionsChange({ width: displayWidth, height: displayHeight })
        }
      }
    }
  }

  return (
    <div className="relative">
      <Webcam
        onUserMedia={handleUserMedia}
        ref={videoRef}
        audio={false}
        videoConstraints={{
          deviceId: deviceId,
          width: { ideal: 1280 }, // Request high resolution to get actual aspect ratio
          height: { ideal: 720 },
        }}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        className="rounded overflow-hidden mx-auto"
        onUserMediaError={() => {}}
      />
    </div>
  )
}
