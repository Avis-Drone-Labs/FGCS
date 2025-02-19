/*
  A component to display a line or multiple lines given a list of coordinates
*/

import { Layer, Source } from "react-map-gl"

export default function DrawLineCoordinates({
  coordinates,
  colour,
  width = 1,
  lineProps = {},
}) {
  return (
    <Source
      type="geojson"
      data={{
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      }}
    >
      <Layer
        {...{
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": colour,
            "line-width": width,
            ...lineProps,
          },
        }}
      />
    </Source>
  )
}
