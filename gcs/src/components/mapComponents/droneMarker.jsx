/*
  The marker to display the drones current position on a map
*/

import { destination, point } from "@turf/turf"
import { Marker } from "react-map-gl"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import arrow from "../../assets/arrow.svg"
import DrawLineCoordinates from "./drawLineCoordinates"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function DroneMarker({
  lat,
  lon,
  heading,
  zoom = null,
  showHeadingLine = false,
  desiredBearing = null,
}) {
  return (
    <>
      <Marker latitude={lat} longitude={lon} scale={0.1}>
        <img
          src={arrow}
          className="w-6 h-6"
          style={{ transform: `rotate(${heading}deg)` }}
        />
      </Marker>

      {showHeadingLine && (
        <DrawLineCoordinates
          coordinates={[
            [lon, lat],
            destination(
              point([lon, lat]),
              zoom ? 25000 / 2 ** zoom : 1,
              heading,
            ).geometry.coordinates,
          ]}
          colour={tailwindColors.blue[200]}
          width={3}
        />
      )}

      {desiredBearing !== null && (
        <DrawLineCoordinates
          coordinates={[
            [lon, lat],
            destination(
              point([lon, lat]),
              zoom ? 25000 / 2 ** zoom : 1,
              desiredBearing,
            ).geometry.coordinates,
          ]}
          colour={tailwindColors.red[200]}
          width={3}
        />
      )}
    </>
  )
}
