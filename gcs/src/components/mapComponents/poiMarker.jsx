/*
  The POI marker to display on a map
*/

// Component imports
import MarkerPin from "./markerPin"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function POIMarker({ id, lat, lon, label }) {
  return (
    <>
      <MarkerPin
        id={id}
        lat={lat}
        lon={lon}
        colour={tailwindColors.red[500]}
        showOnTop={true}
        tooltipText={label}
      />
    </>
  )
}
