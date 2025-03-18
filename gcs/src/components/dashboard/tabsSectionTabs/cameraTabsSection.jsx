/**
 * CameraTabsSection
 * This file contains all relevant components to select and display the drone camera output.
 */

// Native
import { useCallback, useState, useEffect, useRef } from "react"

// Mantine
import { useSessionStorage } from "@mantine/hooks"
import { Tabs, Select } from "@mantine/core"

// Helper
import Webcam from "react-webcam"
import { IconExternalLink, IconVideoOff } from "@tabler/icons-react"

export default function CameraTabsSection({ tabPadding }) {
  // Camera devices
  const [deviceId, setDeviceId] = useSessionStorage({
    key: "deviceId",
    defaultValue: null,
  })

  window.ipcRenderer.onCameraWindowClose(() => setPictureInPicture(false))

  // Ref used to get video capture stream to send to new electron window
  const videoRef = useRef(null)
  const [devices, setDevices] = useState([])

  const [streamLoaded, setStreamLoaded] = useState(false)
  const [invalidStream, setInvalidStream] = useState(false)
  const [pictureInPicture, setPictureInPicture] = useState(false)

  const handleDevices = useCallback(
    (mediaDevices) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  function toggleWebcamPopout() {
    const streamTrack = videoRef.current.video.srcObject.getTracks()[0]
    const streamAspect =
      streamTrack.getSettings().width / streamTrack.getSettings().height

    pictureInPicture
      ? window.ipcRenderer.closeWebcamWindow()
      : window.ipcRenderer.openWebcamWindow(
          deviceId,
          streamTrack.label,
          streamAspect,
        )
    setPictureInPicture(!pictureInPicture)
  }

  function onStreamLoaded() {
    setInvalidStream(false)
    setStreamLoaded(true)
  }

  return (
    <Tabs.Panel value="camera">
      <div className={`flex flex-col gap-4 text-xl ${tabPadding} items-center`}>
        <Select
          placeholder="Select camera input"
          data={devices.map((device) => {
            return { value: device.deviceId, label: device.label }
          })}
          value={deviceId}
          onChange={setDeviceId}
          className={`w-[100%] max-w-[350px] @xl:max-w-[640px]`}
        />
        {deviceId !== null && (
          <div className="relative">
            <Webcam
              onUserMedia={() => onStreamLoaded()}
              ref={videoRef}
              audio={false}
              videoConstraints={{ deviceId: deviceId }}
              className="max-w-[350px] w-[100%] @xl:max-w-[640px]"
              onUserMediaError={() => setInvalidStream(true)}
            />
            {/* Overlay black background instead of conditionally rendering webcam to prevent reloading stream */}
            {pictureInPicture && (
              <div className="absolute top-0 right-0 w-[100%] h-[100%] bg-black" />
            )}

            {/* Overlay invalid stream message if video stream failed to be created */}
            {invalidStream && (
              <div className="flex justify-center items-center absolute top-0 right-0 w-[100%] h-[100%] bg-falcongrey-700">
                <div className="flex flex-col items-center h-[75%] justify-center">
                  <IconVideoOff size={"50%"} />
                  <p className="">No video stream available</p>
                </div>
              </div>
            )}
            {streamLoaded && !pictureInPicture && !invalidStream && (
              <button
                className="absolute top-2 right-2 bg-falcongrey-900/60 p-1 rounded-[0.2em]"
                onClick={() => toggleWebcamPopout()}
              >
                <IconExternalLink
                  stroke={2}
                  className="stroke-slate-200 size-5"
                />
              </button>
            )}
          </div>
        )}
      </div>
    </Tabs.Panel>
  )
}
