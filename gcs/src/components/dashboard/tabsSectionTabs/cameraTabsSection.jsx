// NATIVE
import { useCallback, useState, useEffect } from "react"

// MANTINE
import { useSessionStorage } from "@mantine/hooks"
import { Tabs, Select } from "@mantine/core"

// HELPER
import Webcam from "react-webcam"

export default function CameraTabsSection({ tabPadding }) {
  // Camera devices
  const [deviceId, setDeviceId] = useSessionStorage({
    key: "deviceId",
    defaultValue: null,
  })
  const [devices, setDevices] = useState([])

  const handleDevices = useCallback(
    (mediaDevices) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  return (
    <Tabs.Panel value="camera">
      <div className={`flex flex-col gap-4 text-xl ${tabPadding}`}>
        <Select
          placeholder="Select camera input"
          data={devices.map((device) => {
            return { value: device.deviceId, label: device.label }
          })}
          value={deviceId}
          onChange={setDeviceId}
        />
        {deviceId !== null && (
          <Webcam audio={false} videoConstraints={{ deviceId: deviceId }} />
        )}
      </div>
    </Tabs.Panel>
  )
}
