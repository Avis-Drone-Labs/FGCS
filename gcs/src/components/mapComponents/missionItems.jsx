/*
  The MissionItems component returns the markers and lines connecting the
  markers together on the dashboard map to display. It also filters out any
  items which should not be displayed on the map as markers or not have lines
  connecting them.
*/

import { intToCoord } from "../../helpers/dataFormatters"
import { filterMissionItems } from "../../helpers/filterMissions"

import "maplibre-gl/dist/maplibre-gl.css"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"
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
          <MarkerPin
            key={index}
            lat={intToCoord(item.x)}
            lon={intToCoord(item.y)}
            colour={tailwindColors.yellow[400]}
            text={item.seq}
            tooltipText={item.z ? `Alt: ${item.z}` : null}
          />
        )
      })}

      {/* Show mission item outlines */}
      {missionItems.length > 0 && (
        <DrawLineCoordinates
          coordinates={getListOfLineCoordinates()}
          colour={tailwindColors.yellow[400]}
        />
      )}
    </>
  )
}
