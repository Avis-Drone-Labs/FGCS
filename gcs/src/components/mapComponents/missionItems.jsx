/*
  The MissionItems component returns the markers and lines connecting the
  markers together on the dashboard map to display. It also filters out any
  items which should not be displayed on the map as markers or not have lines
  connecting them.
*/

// Helper imports
import { intToCoord } from "../../helpers/dataFormatters"
import { filterMissionItems } from "../../helpers/filterMissions"

// Styling imports
import "maplibre-gl/dist/maplibre-gl.css"

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

// Tailing styling
import { useEffect, useState } from "react"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function MissionItems({
  missionItems,
  editable = false,
  dragEndCallback = () => {},
}) {
  const [filteredMissionItems, setFilteredMissionItems] = useState(
    filterMissionItems(missionItems),
  )
  const [listOfLineCoords, setListOfLineCoords] = useState([])
  const [listOfDottedLineCoords, setListOfDottedLineCoords] = useState([])

  useEffect(() => {
    setFilteredMissionItems(filterMissionItems(missionItems))
  }, [missionItems])

  useEffect(() => {
    const { solid: solidLineCoords, dotted: dottedLineCoords } =
      getListOfLineCoordinates(filteredMissionItems)

    setListOfLineCoords(solidLineCoords)
    setListOfDottedLineCoords(dottedLineCoords)
  }, [filteredMissionItems])

  function getListOfLineCoordinates(filteredMissionItems) {
    if (filteredMissionItems.length === 0) return { solid: [], dotted: [] }

    const lineCoordsList = []
    const dottedLineCoordsList = []

    // Stop processing waypoints after a land command
    const landCommandIndex = filteredMissionItems.findIndex((item) =>
      [21, 189].includes(item.command),
    )
    const itemsToProcess =
      landCommandIndex === -1
        ? filteredMissionItems
        : filteredMissionItems.slice(0, landCommandIndex + 1)

    itemsToProcess.forEach((item) => {
      lineCoordsList.push([intToCoord(item.y), intToCoord(item.x)])
    })

    // Join the last item to first item if aircraft does not land, with a
    // dotted line
    if (
      ![21, 189].includes(
        itemsToProcess[itemsToProcess.length - 1].command, // Use itemsToProcess here
      )
    ) {
      dottedLineCoordsList.push([
        intToCoord(itemsToProcess[0].y), // Use itemsToProcess here
        intToCoord(itemsToProcess[0].x),
      ])
      dottedLineCoordsList.push([
        intToCoord(itemsToProcess[itemsToProcess.length - 1].y), // Use itemsToProcess here
        intToCoord(itemsToProcess[itemsToProcess.length - 1].x),
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

    return { solid: lineCoordsList, dotted: dottedLineCoordsList }
  }

  return (
    <>
      {/* Show mission item LABELS */}
      {filteredMissionItems.map((item, index) => {
        return (
          <MarkerPin
            key={index}
            id={item.id}
            lat={intToCoord(item.x)}
            lon={intToCoord(item.y)}
            colour={tailwindColors.yellow[400]}
            text={`${item.seq}`}
            tooltipText={item.z ? `Alt: ${item.z}` : null}
            draggable={editable}
            dragEndCallback={dragEndCallback}
          />
        )
      })}

      {/* Show mission item outlines */}
      <DrawLineCoordinates
        coordinates={listOfLineCoords}
        colour={tailwindColors.yellow[400]}
      />

      <DrawLineCoordinates
        coordinates={listOfDottedLineCoords}
        colour={tailwindColors.yellow[400]}
        lineProps={{ "line-dasharray": [2, 2] }}
      />
    </>
  )
}
