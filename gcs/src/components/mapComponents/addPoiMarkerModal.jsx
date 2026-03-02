import { Button, Modal, TextInput } from "@mantine/core"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { addPoiMarker } from "../../redux/slices/droneConnectionSlice"

export default function AddPoiMarkerModal({
  modalOpened,
  setModalOpened,
  lat,
  lon,
}) {
  const dispatch = useDispatch()

  const [poiLabel, setPoiLabel] = useState("")

  function addMarker() {
    dispatch(addPoiMarker({ label: poiLabel, lat, lon }))
    setPoiLabel("")
    setModalOpened(false)
  }

  return (
    <Modal
      opened={modalOpened}
      onClose={() => setModalOpened(false)}
      title="Add POI Marker"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col gap-4">
        <TextInput
          placeholder="Enter POI label"
          value={poiLabel}
          onChange={(event) => setPoiLabel(event.currentTarget.value)}
        />
        <div className="flex gap-2">
          <Button onClick={addMarker} color="green" disabled={!poiLabel.trim()}>
            Add Marker
          </Button>
        </div>
      </div>
    </Modal>
  )
}
