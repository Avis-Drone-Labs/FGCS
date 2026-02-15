/**
 * Distance Measurement Components
 * Displays markers, line, and result modal for distance measurement on maps
 */

import { Modal } from "@mantine/core"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export function DistanceMeasurementMarkers({
  measureDistanceStart,
  measureDistanceEnd,
}) {
  return (
    <>
      {measureDistanceStart !== null && (
        <MarkerPin
          lat={measureDistanceStart.lat}
          lon={measureDistanceStart.lng}
          colour={tailwindColors.green[500]}
          tooltipText="Distance measurement start"
        />
      )}

      {measureDistanceEnd !== null && (
        <MarkerPin
          lat={measureDistanceEnd.lat}
          lon={measureDistanceEnd.lng}
          colour={tailwindColors.red[500]}
          tooltipText="Distance measurement end"
        />
      )}

      {measureDistanceStart !== null && measureDistanceEnd !== null && (
        <DrawLineCoordinates
          coordinates={[
            [measureDistanceStart.lng, measureDistanceStart.lat],
            [measureDistanceEnd.lng, measureDistanceEnd.lat],
          ]}
          colour={tailwindColors.blue[500]}
          width={3}
        />
      )}
    </>
  )
}

export function DistanceMeasurementModal({ measureDistanceResult, onClose }) {
  return (
    <Modal
      opened={!!measureDistanceResult}
      onClose={onClose}
      title="Distance Measurement"
      centered
    >
      <p>
        {measureDistanceResult !== null
          ? `${measureDistanceResult.toFixed(2)} metres`
          : "N/A"}
      </p>
    </Modal>
  )
}
