/*
  The home position marker to display on a map
*/

// Component imports
import DrawLineCoordinates from "./drawLineCoordinates"
import MarkerPin from "./markerPin"

import { useSessionStorage } from "@mantine/hooks"
import { useSelector } from "react-redux"
import { selectActiveTab } from "../../redux/slices/missionSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function HomeMarker({
  lat,
  lon,
  updateMissionHomePositionDragCb,
  lineTo = null,
}) {
  const [currentPage] = useSessionStorage({ key: "currentPage" })
  const activeTab = useSelector(selectActiveTab)

  return (
    <>
      <MarkerPin
        id="home"
        lat={lat}
        lon={lon}
        colour={tailwindColors.green[400]}
        text={"H"}
        showOnTop={true}
        draggable={currentPage === "missions" && activeTab === "mission"}
        dragEndCallback={updateMissionHomePositionDragCb}
        tooltipText={
          currentPage === "missions" && activeTab === "mission"
            ? "Planned home"
            : null
        }
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
