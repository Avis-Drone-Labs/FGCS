/*
  The marker to display the drones current position on a map
*/

// Map based imports
import { destination, point } from "@turf/turf"
import { Marker } from "react-map-gl"

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"

// Asset imports
import arrow from "../../assets/arrow.svg"

// Tailwind styling
import { useSelector } from "react-redux"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import {
  selectDesiredBearing,
  selectHeading,
} from "../../redux/slices/droneInfoSlice"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function DroneMarker({
  lat,
  lon,
  zoom = null,
  showHeadingLine = false,
}) {
  const heading = useSelector(selectHeading)
  const desiredBearing = useSelector(selectDesiredBearing)

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
