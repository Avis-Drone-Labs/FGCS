"use client"

import JSMpeg from "@cycjimmy/jsmpeg-player"
import { IconX } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"

export default function VideoWindow() {
  const searchParams = new URLSearchParams(window.location.search)

  const videoRef = useRef(null)
  const jsmpegPlayerRef = useRef(null)
  const [error, setError] = useState(null)

  const deviceId = searchParams.get("deviceId")
  const streamUrl = searchParams.get("streamUrl")
  const videoType = searchParams.get("type")
  const deviceName = searchParams.get("deviceName")

  function destroyJSMpegPlayer() {
    if (jsmpegPlayerRef.current) {
      try {
        if (typeof jsmpegPlayerRef.current.destroy === "function") {
          jsmpegPlayerRef.current.destroy()
        } else if (typeof jsmpegPlayerRef.current.stop === "function") {
          jsmpegPlayerRef.current.stop()
        }

        // Get canvas element and clean up WebGL context
        const canvas = videoRef.current?.querySelector("canvas")
        if (canvas) {
          const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
          if (gl && gl.getExtension) {
            const loseContext = gl.getExtension("WEBGL_lose_context")
            if (loseContext) {
              loseContext.loseContext()
            }
          }
          canvas.remove()
        }

        jsmpegPlayerRef.current = null
        setError(null)
      } catch (error) {
        console.warn("Error cleaning up previous JSMpeg player:", error)
      }
    }
  }

  function setupJSMpegPlayer() {
    if (!streamUrl || !videoRef.current) return

    destroyJSMpegPlayer()

    try {
      const player = new JSMpeg.VideoElement(videoRef.current, streamUrl, {
        poster: "",
        autoplay: true,
        audio: false,
        loop: false,
        videoBufferSize: 512 * 1024,
        pauseWhenHidden: false,
        disableGl: false,
        preserveDrawingBuffer: false,
        progressive: true,
        throttled: false,
        chunkSize: 1024 * 4,
        videoDecodeChunkSize: 512 * 1024,
        hooks: {
          load: () => {
            console.log("JSMpeg: Stream loaded successfully")
            setError(null)
          },
          play: () => {
            console.log("JSMpeg: Stream playing")
          },
          stop: () => {
            console.log("JSMpeg: Stream stopped")
          },
        },
      })

      jsmpegPlayerRef.current = player
    } catch (error) {
      console.error("Error setting up JSMpeg player:", error)
      setError(`Failed to setup stream: ${error.message}`)
    }
  }

  useEffect(() => {
    if (videoType === "stream" && streamUrl) {
      setupJSMpegPlayer()
    }

    return () => {
      destroyJSMpegPlayer()
    }
  }, [videoType, streamUrl])

  return (
    <div className="w-[100%] h-[100%] overflow-hidden bg-black">
      <div
        className={
          "flex flex-row items-center justify-between bg-falcongrey-800 h-7 allow-drag"
        }
      >
        <div className="text-slate-400 px-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {deviceName}
        </div>
        <button
          className="group px-2 no-drag hover:bg-red-500 h-[100%]"
          onClick={() => window.ipcRenderer.invoke("app:close-video-window")}
        >
          <IconX
            stroke={2}
            size="20px"
            className="stroke-slate-400 group-hover:stroke-white"
          />
        </button>
      </div>

      <div className="w-full h-[calc(100%-28px)]">
        {videoType === "webcam" && deviceId && (
          <Webcam
            audio={false}
            ref={videoRef}
            videoConstraints={{ deviceId: deviceId }}
            width="100%"
            height="100%"
            className="object-contain"
          />
        )}

        {videoType === "stream" && (
          <div
            ref={videoRef}
            className="w-full h-full bg-black flex items-center justify-center"
          >
            {error && (
              <div className="text-red-400 text-center p-4">{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
