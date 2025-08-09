/*
  The missions map.

  This uses maplibre to load the map, currently (as of 16/03/2025) this needs an internet
  connection to load but this will be addressed in later versions of FGCS. Please check
  docs/changelogs if this description has not been updated.
*/

// Base imports
import React, { useEffect, useRef, useState } from "react"

// Maplibre and mantine imports
import {
  useClipboard,
  useLocalStorage,
  usePrevious,
  useSessionStorage,
} from "@mantine/hooks"
import "maplibre-gl/dist/maplibre-gl.css"
import Map from "react-map-gl/maplibre"

// Helper scripts
import { v4 as uuidv4 } from "uuid"
import { intToCoord } from "../../helpers/dataFormatters"
import { filterMissionItems } from "../../helpers/filterMissions"
import { showNotification } from "../../helpers/notification"
import { useSettings } from "../../helpers/settings"

// Other dashboard imports
import ContextMenuItem from "../mapComponents/contextMenuItem"
import ContextMenuSubMenuItem from "../mapComponents/contextMenuSubMenuItem"
import DroneMarker from "../mapComponents/droneMarker"
import FenceItems from "../mapComponents/fenceItems"
import HomeMarker from "../mapComponents/homeMarker"
import MarkerPin from "../mapComponents/markerPin"
import MissionItems from "../mapComponents/missionItems"
import Polygon from "../mapComponents/polygon"
import useContextMenu from "../mapComponents/useContextMenu"
import Divider from "../toolbar/menus/divider"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const coordsFractionDigits = 7

function MapSectionNonMemo({
  passedRef,
  data,
  heading,
  desiredBearing,
  missionItems,
  homePosition,
  onDragstart,
  getFlightMode,
  currentTab,
  markerDragEndCallback,
  addNewMissionItem,
  updateMissionHomePosition,
  clearMissionItems,
  mapId = "dashboard",
}) {
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [guidedModePinData] = useSessionStorage({
    key: "guidedModePinData",
    defaultValue: null,
  })

  const [position, setPosition] = useState(null)
  const { getSetting } = useSettings()

  // Check if maps should be synchronized (from settings)
  const syncMaps = getSetting("General.syncMapViews") || false

  // Use either a shared key or a unique key based on the setting
  const viewStateKey = syncMaps
    ? "initialViewState"
    : `initialViewState_${mapId}`

  const [initialViewState, setInitialViewState] = useLocalStorage({
    key: viewStateKey,
    defaultValue: { latitude: 53.381655, longitude: -1.481434, zoom: 17 },
    getInitialValueInEffect: false,
  })
  const previousHomePositionValue = usePrevious(homePosition)

  const [missionItemsList, setMissionItemsList] = useState(
    missionItems.mission_items,
  )
  const [filteredMissionItems, setFilteredMissionItems] = useState([])

  const contextMenuRef = useRef()
  const { clicked, setClicked, points, setPoints } = useContextMenu()
  const [
    contextMenuPositionCalculationInfo,
    setContextMenuPositionCalculationInfo,
  ] = useState()
  const [clickedGpsCoords, setClickedGpsCoords] = useState({ lng: 0, lat: 0 })

  const clipboard = useClipboard({ timeout: 500 })

  const [polygonDrawMode, setPolygonDrawMode] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState([])

  useEffect(() => {
    return () => {}
  }, [connected])

  useEffect(() => {
    // Check latest data point is valid
    if (isNaN(data.lat) || isNaN(data.lon) || data.lon === 0 || data.lat === 0)
      return

    // Move drone icon on map
    let lat = intToCoord(data.lat)
    let lon = intToCoord(data.lon)
    setPosition({ latitude: lat, longitude: lon })
  }, [data])

  useEffect(() => {
    setFilteredMissionItems(filterMissionItems(missionItemsList))
  }, [missionItemsList])

  useEffect(() => {
    setMissionItemsList(missionItems.mission_items)
  }, [missionItems])

  useEffect(() => {
    if (contextMenuRef.current) {
      const contextMenuWidth = Math.round(
        contextMenuRef.current.getBoundingClientRect().width,
      )
      const contextMenuHeight = Math.round(
        contextMenuRef.current.getBoundingClientRect().height,
      )
      let x = contextMenuPositionCalculationInfo.clickedPoint.x
      let y = contextMenuPositionCalculationInfo.clickedPoint.y

      if (
        contextMenuWidth + contextMenuPositionCalculationInfo.clickedPoint.x >
        contextMenuPositionCalculationInfo.canvasSize.width
      ) {
        x = contextMenuPositionCalculationInfo.clickedPoint.x - contextMenuWidth
      }
      if (
        contextMenuHeight + contextMenuPositionCalculationInfo.clickedPoint.y >
        contextMenuPositionCalculationInfo.canvasSize.height
      ) {
        y =
          contextMenuPositionCalculationInfo.clickedPoint.y - contextMenuHeight
      }

      setPoints({ x, y })
    }
  }, [contextMenuPositionCalculationInfo])

  useEffect(() => {
    // center map on home point only on first instance of home point being
    // received from the drone
    if (
      passedRef.current &&
      homePosition !== null &&
      previousHomePositionValue === null
    ) {
      setInitialViewState({
        latitude: intToCoord(homePosition.lat),
        longitude: intToCoord(homePosition.lon),
        zoom: initialViewState.zoom,
      })
      passedRef.current.getMap().flyTo({
        center: [intToCoord(homePosition.lon), intToCoord(homePosition.lat)],
        zoom: initialViewState.zoom,
      })
    }
  }, [homePosition])

  function addNewPolygonVertex(lat, lon) {
    if (!polygonDrawMode) return

    // Add new point to polygon points
    setPolygonPoints((prevPoints) => [
      ...prevPoints,
      { id: uuidv4(), lat: lat, lon: lon },
    ])
  }

  function updatePolygonVertex(updatedPolygonVertex) {
    setPolygonPoints((prevPoints) =>
      prevPoints.map((item) =>
        item.id === updatedPolygonVertex.id
          ? {
              ...item,
              lat: intToCoord(updatedPolygonVertex.x),
              lon: intToCoord(updatedPolygonVertex.y),
            }
          : item,
      ),
    )
  }

  return (
    <div className="w-initial h-full" id="map">
      <Map
        initialViewState={initialViewState}
        mapStyle={`https://api.maptiler.com/maps/${getSetting("General.mapStyle") || "hybrid"}/style.json?key=${getSetting("General.maptilerAPIKey") || import.meta.env.VITE_MAPTILER_API_KEY}`}
        ref={passedRef}
        attributionControl={false}
        dragRotate={false}
        touchRotate={false}
        onMoveEnd={(newViewState) =>
          setInitialViewState({
            latitude: newViewState.viewState.latitude,
            longitude: newViewState.viewState.longitude,
            zoom: newViewState.viewState.zoom,
          })
        }
        onDragStart={onDragstart}
        onContextMenu={(e) => {
          e.preventDefault()
          setClicked(true)
          setClickedGpsCoords(e.lngLat)
          setContextMenuPositionCalculationInfo({
            clickedPoint: e.point,
            canvasSize: {
              height: e.originalEvent.target.clientHeight,
              width: e.originalEvent.target.clientWidth,
            },
          })
        }}
        onMouseDown={() => {
          setClicked(false)
        }}
        onClick={(e) => {
          setClicked(false)
          let lat = e.lngLat.lat
          let lon = e.lngLat.lng

          if (polygonDrawMode) {
            addNewPolygonVertex(lat, lon)
          } else {
            addNewMissionItem(lat, lon)
          }
        }}
        cursor="default"
      >
        {/* Show marker on map if the position is set */}
        {position !== null &&
          !isNaN(position?.latitude) &&
          !isNaN(position?.longitude) && (
            <DroneMarker
              lat={position.latitude}
              lon={position.longitude}
              heading={heading ?? 0}
              zoom={initialViewState.zoom}
              showHeadingLine={true}
              desiredBearing={desiredBearing ?? 0}
            />
          )}

        <Polygon
          polygonPoints={polygonPoints}
          editable={polygonDrawMode}
          dragEndCallback={updatePolygonVertex}
        />

        <MissionItems
          missionItems={missionItemsList}
          editable={currentTab === "mission"}
          dragEndCallback={markerDragEndCallback}
        />

        <FenceItems
          fenceItems={missionItems.fence_items}
          editable={currentTab === "fence"}
          dragEndCallback={markerDragEndCallback}
        />

        {/* Show mission rally point */}
        {missionItems.rally_items.map((item, index) => {
          return (
            <MarkerPin
              key={index}
              id={item.id}
              lat={intToCoord(item.x)}
              lon={intToCoord(item.y)}
              colour={tailwindColors.purple[400]}
              text={`${item.seq}`}
              tooltipText={item.z ? `Alt: ${item.z}` : null}
              draggable={currentTab === "rally"}
              dragEndCallback={markerDragEndCallback}
            />
          )
        })}

        {getFlightMode() === "Guided" && guidedModePinData !== null && (
          <MarkerPin
            lat={guidedModePinData.lat}
            lon={guidedModePinData.lon}
            colour={tailwindColors.pink[500]}
            tooltipText={
              guidedModePinData.alt ? `Alt: ${guidedModePinData.alt}` : null
            }
          />
        )}

        {/* Show home position */}
        {homePosition !== null && (
          <HomeMarker
            lat={intToCoord(homePosition.lat)}
            lon={intToCoord(homePosition.lon)}
            updateMissionHomePositionDragCb={({ x, y }) => {
              updateMissionHomePosition(x, y)
            }}
            lineTo={
              filteredMissionItems.length > 0 && [
                intToCoord(filteredMissionItems[0].y),
                intToCoord(filteredMissionItems[0].x),
              ]
            }
          />
        )}

        {clicked && (
          <div
            ref={contextMenuRef}
            className="absolute bg-falcongrey-700 rounded-md p-1"
            style={{ top: points.y, left: points.x }}
          >
            <ContextMenuItem
              onClick={() => {
                clipboard.copy(
                  `${clickedGpsCoords.lat}, ${clickedGpsCoords.lng}`,
                )
                showNotification("Copied to clipboard")
              }}
            >
              <p>
                {clickedGpsCoords.lat.toFixed(coordsFractionDigits)},{" "}
                {clickedGpsCoords.lng.toFixed(coordsFractionDigits)}
              </p>
              <svg
                className="relative -right-1"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V7q0-.425.288-.712T4 6t.713.288T5 7v13h10q.425 0 .713.288T16 21t-.288.713T15 22zm4-6V4z"
                />
              </svg>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                updateMissionHomePosition(
                  clickedGpsCoords.lat,
                  clickedGpsCoords.lng,
                )
              }}
            >
              <p>Set home position</p>
            </ContextMenuItem>
            <ContextMenuItem onClick={clearMissionItems}>
              <p>Clear mission</p>
            </ContextMenuItem>
            <Divider />
            <ContextMenuSubMenuItem title={"Polygon"}>
              <ContextMenuItem
                onClick={() => {
                  setPolygonDrawMode(true)
                }}
              >
                <p>Draw polygon</p>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setPolygonPoints([])
                  setPolygonDrawMode(false)
                }}
              >
                <p>Clear polygon</p>
              </ContextMenuItem>
              {currentTab === "fence" && (
                <>
                  <ContextMenuItem>
                    <p>Fence inclusion</p>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <p>Fence exclusion</p>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuSubMenuItem>
          </div>
        )}
      </Map>
    </div>
  )
}

function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const MissionsMapSection = React.memo(MapSectionNonMemo, propsAreEqual)

export default MissionsMapSection
