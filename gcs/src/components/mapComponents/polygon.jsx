/*
  The PolygonItems component returns the markers and lines connecting the
  polygon together on the map to display.
*/

// Helper imports

// Styling imports
import "maplibre-gl/dist/maplibre-gl.css"

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

// Tailing styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Polygon({
  polygonPoints,
  editable = false,
  dragEndCallback = () => {},
}) {
  return (
    <>
      {/* Show polygon MARKERS */}
      {polygonPoints.map((item, index) => {
        return (
          <MarkerPin
            key={index}
            id={item.id}
            lat={item.lat}
            lon={item.lon}
            colour={tailwindColors.red[400]}
            draggable={editable}
            dragEndCallback={dragEndCallback}
          />
        )
      })}

      {/* Show polygon outlines */}
      {polygonPoints.length > 0 && (
        <DrawLineCoordinates
          coordinates={[
            ...polygonPoints.map((item) => [item.lon, item.lat]),
            [polygonPoints[0].lon, polygonPoints[0].lat],
          ]}
          colour={tailwindColors.red[200]}
        />
      )}
    </>
  )
}
