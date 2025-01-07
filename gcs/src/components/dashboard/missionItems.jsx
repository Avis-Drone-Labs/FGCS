/*
  The MissionItems component returns the markers and lines connecting the
  markers together on the dashboard map to display. It also filters out any
  items which should not be displayed on the map as markers or not have lines
  connecting them.
*/

import { filterMissionItems, intToCoord } from "./map"

import { Tooltip } from "@mantine/core"
import "maplibre-gl/dist/maplibre-gl.css"
import { Layer, Marker, Source } from "react-map-gl/maplibre"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function MissionItems({ missionItems }) {
  const filteredMissionItems = filterMissionItems(missionItems)
  const filteredMissionItemsCount = filteredMissionItems.length

  function getListOfLineCoordinates() {
    const lineCoordsList = []

    filteredMissionItems.forEach((item) => {
      lineCoordsList.push([intToCoord(item.y), intToCoord(item.x)])
    })

    // Join the last item to first item if aircraft does not land
    if (
      ![21, 189].includes(
        filteredMissionItems[filteredMissionItemsCount - 1].command,
      )
    ) {
      lineCoordsList.push([
        intToCoord(filteredMissionItems[0].y),
        intToCoord(filteredMissionItems[0].x),
      ])
    }

    // Connect jump commands to previously displayed item and jump target item
    const jumpCommandItems = missionItems.filter((item) => item.command === 177)
    jumpCommandItems.forEach((jumpItem) => {
      const nextItem = filteredMissionItems.find((item) => {
        return item.seq === jumpItem.param1
      })
      if (nextItem === undefined) return

      const lastFilteredItem = filteredMissionItems
        .filter((item) => item.seq < jumpItem.seq)
        .at(-1)

      lineCoordsList.push([
        intToCoord(lastFilteredItem.y),
        intToCoord(lastFilteredItem.x),
      ])
      lineCoordsList.push([intToCoord(nextItem.y), intToCoord(nextItem.x)])
    })

    return lineCoordsList
  }

  return (
    <>
      {/* Show mission item LABELS */}
      {filteredMissionItems.map((item, index) => {
        return (
          <Marker
            key={index}
            longitude={intToCoord(item.y)}
            latitude={intToCoord(item.x)}
          >
            <Tooltip label={item.z ? `Alt: ${item.z}` : ""}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 48"
                fill={tailwindColors.yellow[400]}
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black"
              >
                <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
                <text textAnchor="middle" x="12" y="14" className="text-black">
                  {item.seq}
                </text>
              </svg>
            </Tooltip>
          </Marker>
        )
      })}

      {/* Show mission item outlines */}
      {missionItems.length > 0 && (
        <Source
          type="geojson"
          data={{
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: getListOfLineCoordinates(),
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
                "line-color": tailwindColors.yellow[400],
                "line-width": 1,
              },
            }}
          />
        </Source>
      )}
    </>
  )
}
