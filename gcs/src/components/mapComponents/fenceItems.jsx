/*
  The FenceItems component returns the markers and lines connecting the
  markers together on the map to display. It also filters out any
  items which should not be displayed on the map as markers or not have lines
  connecting them. It properly parses the type of fence marker.
*/

import { useEffect, useState } from "react"

// Helper imports
import { intToCoord } from "../../helpers/dataFormatters"

// Styling imports
import "maplibre-gl/dist/maplibre-gl.css"

// Component imports

// Tailing styling
import { circle } from "@turf/turf"
import { Layer, Source } from "react-map-gl"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import { FENCE_ITEM_COMMANDS_LIST } from "../../helpers/mavlinkConstants"
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function getFenceCommandNumber(value) {
  return parseInt(
    Object.keys(FENCE_ITEM_COMMANDS_LIST).filter(
      (key) => FENCE_ITEM_COMMANDS_LIST[key] === value,
    ),
  )
}

const polygonCommands = [
  getFenceCommandNumber("MAV_CMD_NAV_FENCE_POLYGON_VERTEX_INCLUSION"),
  getFenceCommandNumber("MAV_CMD_NAV_FENCE_POLYGON_VERTEX_EXCLUSION"),
]
const circleCommands = [
  getFenceCommandNumber("MAV_CMD_NAV_FENCE_CIRCLE_INCLUSION"),
  getFenceCommandNumber("MAV_CMD_NAV_FENCE_CIRCLE_EXCLUSION"),
]

export default function FenceItems({
  fenceItems,
  editable = false,
  dragEndCallback = () => {},
}) {
  const [fencePolygonItems, setFencePolygonItems] = useState([])
  const [fenceCircleItems, setFenceCircleItems] = useState([])

  useEffect(() => {
    // Filter out fence items based on their type
    const polygonItems = fenceItems.filter((item) =>
      polygonCommands.includes(item.command),
    )
    const circleItems = fenceItems.filter((item) =>
      circleCommands.includes(item.command),
    )

    setFencePolygonItems(polygonItems)
    setFenceCircleItems(circleItems)
  }, [fenceItems])

  return (
    <>
      {/* Show mission geo-fence MARKERS */}
      {fencePolygonItems.map((item, index) => {
        return (
          <MarkerPin
            key={index}
            id={item.id}
            lat={intToCoord(item.x)}
            lon={intToCoord(item.y)}
            colour={tailwindColors.blue[400]}
            draggable={editable}
            dragEndCallback={dragEndCallback}
          />
        )
      })}

      {/* Group fencePolygonItems into separate polygons */}
      {(() => {
        const polygons = []
        let currentPolygon = []
        let currentPoints = 0

        fencePolygonItems.forEach((item) => {
          currentPolygon.push(item)
          currentPoints++

          if (currentPoints === item.param1) {
            polygons.push(currentPolygon)
            currentPolygon = []
            currentPoints = 0
          }
        })

        return polygons.map((polygon, index) => {
          const lastPolygonItem = polygon[polygon.length - 1]

          const color =
            lastPolygonItem.command === 5002
              ? tailwindColors.red[500]
              : tailwindColors.blue[200]

          return (
            <DrawLineCoordinates
              key={index}
              coordinates={[
                ...polygon.map((item) => [
                  intToCoord(item.y),
                  intToCoord(item.x),
                ]),
                [intToCoord(polygon[0].y), intToCoord(polygon[0].x)],
              ]}
              colour={color}
              lineProps={{ "line-width": 2, "line-dasharray": [4, 6] }}
              fillLayer={true}
              fillOpacity={lastPolygonItem.command === 5002 ? 0.2 : 0}
            />
          )
        })
      })()}

      {fenceCircleItems.map((item, index) => {
        return (
          <MarkerPin
            key={index}
            id={item.id}
            lat={intToCoord(item.x)}
            lon={intToCoord(item.y)}
            colour={tailwindColors.blue[400]}
            draggable={editable}
            dragEndCallback={dragEndCallback}
          />
        )
      })}

      <Source
        id="circle-source"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: fenceCircleItems.map((item) =>
            circle([intToCoord(item.y), intToCoord(item.x)], item.param1, {
              steps: 64, // Number of points to create the circle
              units: "meters", // Units for the radius
              properties: {
                color:
                  item.command === 5004
                    ? tailwindColors.red[500]
                    : tailwindColors.blue[200],
                fillOpacity: item.command === 5004 ? 0.2 : 0, // No fill if inclusion
              },
            }),
          ),
        }}
      >
        <Layer
          id="fence-circle-fill-layer"
          type="fill"
          paint={{
            "fill-color": ["get", "color"],
            "fill-opacity": ["get", "fillOpacity"],
          }}
        />
        <Layer
          id="fence-circle-border-layer"
          type="line"
          paint={{
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-dasharray": [2, 2],
          }}
        />
      </Source>
    </>
  )
}
