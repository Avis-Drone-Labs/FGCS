/*
  The MissionItems component returns the markers and lines connecting the
  markers together on the dashboard map to display. It also filters out any
  items which should not be displayed on the map as markers or not have lines
  connecting them.
*/
import { useMemo } from "react"
import { useSelector } from "react-redux"
import { selectCurrentPage } from "../../redux/slices/droneConnectionSlice"
import { selectHomePosition } from "../../redux/slices/droneInfoSlice"
import {
  selectActiveTab,
  selectPlannedHomePosition,
} from "../../redux/slices/missionSlice"

// Helper imports
import { intToCoord } from "../../helpers/dataFormatters"
import { filterMissionItems } from "../../helpers/filterMissions"

// Styling imports
import "maplibre-gl/dist/maplibre-gl.css"

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function MissionItems({ missionItems }) {
  const currentPage = useSelector(selectCurrentPage)
  const editable =
    useSelector(selectActiveTab) === "mission" && currentPage === "missions"
  const plannedHomePosition = useSelector(selectPlannedHomePosition)
  const currentHomePosition = useSelector(selectHomePosition)
  const homePosition =
    currentPage === "missions" ? plannedHomePosition : currentHomePosition

  const filteredMissionItems = useMemo(
    () => filterMissionItems(missionItems),
    [missionItems],
  )

  const takeoffWaypoint = useMemo(() => {
    return missionItems.find((item) => item.command === 22)
  }, [missionItems])

  const { solid: listOfLineCoords, dotted: listOfDottedLineCoords } = useMemo(
    () => getListOfLineCoordinates(filteredMissionItems),
    [filteredMissionItems, homePosition, takeoffWaypoint],
  )

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

    // Use home as the starting point
    if (homePosition) {
      const homeCoord = [
        intToCoord(homePosition.lon),
        intToCoord(homePosition.lat),
      ]
      if (
        takeoffWaypoint !== undefined &&
        takeoffWaypoint.seq < itemsToProcess[0].seq // If the takeoff waypoint is before the first displayed waypoint
      ) {
        // If there is a takeoff waypoint before the first displayed waypoint, draw a solid line from the home position (takeoff point)
        lineCoordsList.push(homeCoord)
      } else {
        // Draw a dotted line from the home position to the first displayed waypoint
        dottedLineCoordsList.push(homeCoord)
        dottedLineCoordsList.push([
          intToCoord(itemsToProcess[0].y),
          intToCoord(itemsToProcess[0].x),
        ])
      }
    }

    itemsToProcess.forEach((item) => {
      lineCoordsList.push([intToCoord(item.y), intToCoord(item.x)])
    })

    // Join the last item to first item if aircraft does not land, with a dotted line
    if (
      ![21, 189].includes(itemsToProcess[itemsToProcess.length - 1].command)
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
          />
        )
      })}

      {/* Show mission item outlines */}
      <DrawLineCoordinates
        coordinates={listOfLineCoords}
        colour={tailwindColors.yellow[400]}
        lineProps={{ "line-width": 2 }}
      />

      <DrawLineCoordinates
        coordinates={listOfDottedLineCoords}
        colour={tailwindColors.yellow[400]}
        lineProps={{ "line-width": 2, "line-dasharray": [4, 6] }}
      />
    </>
  )
}
