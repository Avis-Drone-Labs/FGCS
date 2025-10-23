/*
This component provides a modal to select the video source for the VideoWidget.
*/

import { Modal, SegmentedControl, Select } from "@mantine/core"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSettings } from "../../helpers/settings"
import {
  selectVideoSource,
  setVideoSource,
} from "../../redux/slices/droneConnectionSlice"

export default function VideoWidgetSourceSelectModal({ opened, onClose }) {
  const dispatch = useDispatch()

  const videoSource = useSelector(selectVideoSource)

  const { getSetting } = useSettings()
  const rtspStreams = getSetting("Video.rtspStreams") || []
  const [webcamDevices, setWebcamDevices] = useState([])

  const [selectVideoSourceType, setSelectVideoSourceType] = useState("stream")

  const handleDevices = useCallback(
    (mediaDevices) =>
      setWebcamDevices(
        mediaDevices.filter(({ kind }) => kind === "videoinput"),
      ),
    [setWebcamDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select a video input source"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        content: {
          borderRadius: "0.5rem",
        },
      }}
    >
      <div className="space-y-4">
        <SegmentedControl
          value={selectVideoSourceType}
          onChange={setSelectVideoSourceType}
          data={[
            { label: "Stream", value: "stream" },
            {
              label: "Webcam",
              value: "webcam",
            },
          ]}
          fullWidth
        />

        {selectVideoSourceType === "stream" ? (
          <Select
            label="Select RTSP Stream"
            placeholder={
              rtspStreams.length === 0
                ? "No RTSP streams configured"
                : "Select an RTSP stream"
            }
            value={videoSource?.type === "stream" ? videoSource.url : null}
            onChange={(_, option) => {
              option === null
                ? dispatch(setVideoSource(null))
                : dispatch(
                    setVideoSource({
                      type: "stream",
                      url: option.value,
                      name: option.label,
                    }),
                  )
            }}
            data={rtspStreams
              .filter((stream) => stream.name && stream.url)
              .map((stream) => ({
                value: stream.url,
                label: stream.name,
              }))}
            allowDeselect
            clearable
          />
        ) : (
          <Select
            label="Select Webcam"
            placeholder={
              webcamDevices.length === 0
                ? "No webcams found"
                : "Select a webcam"
            }
            value={videoSource?.type === "webcam" ? videoSource.deviceId : null}
            onChange={(_, option) => {
              option === null
                ? dispatch(setVideoSource(null))
                : dispatch(
                    setVideoSource({
                      type: "webcam",
                      deviceId: option.value,
                      name: option.label,
                    }),
                  )
            }}
            data={webcamDevices.map((device) => ({
              value: device.deviceId,
              label: device.label || `Camera ${device.deviceId}`,
            }))}
            allowDeselect
            clearable
          />
        )}
      </div>
    </Modal>
  )
}
