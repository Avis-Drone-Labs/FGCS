/*
  The home position marker to display on a map
*/

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function HomeMarker({
  lat,
  lon,
  updateMissionHomePositionDragCb,
  lineTo = null,
}) {
  return (
    <>
      <MarkerPin
        lat={lat}
        lon={lon}
        colour={tailwindColors.green[400]}
        text={"H"}
        showOnTop={true}
        draggable={true}
        dragEndCallback={updateMissionHomePositionDragCb}
      />
      {lineTo !== null && (
        <DrawLineCoordinates
          coordinates={[[lon, lat], lineTo]}
          colour={tailwindColors.yellow[400]}
        />
      )}
    </>
  )
}
