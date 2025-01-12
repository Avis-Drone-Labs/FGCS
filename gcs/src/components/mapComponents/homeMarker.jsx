/*
  The home position marker to display on a map
*/

import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function HomeMarker({ lat, lon, lineTo = null }) {
  return (
    <>
      <MarkerPin
        lat={lat}
        lon={lon}
        colour={tailwindColors.green[400]}
        text={"H"}
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
