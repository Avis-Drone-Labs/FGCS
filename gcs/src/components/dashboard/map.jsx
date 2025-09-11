/*
  The dashboard map.

  This uses maplibre to load the map, currently (as of 23/04/2024) this needs an internet
  connection to load but this will be addressed in later versions of FGCS. Please check
  docs/changelogs if this description has not been updated.
*/

// Base imports
import React, { useEffect, useRef, useState } from "react"

// Maplibre and mantine imports
import { Button, Divider, Modal, NumberInput } from "@mantine/core"
import {
  useClipboard,
  useDisclosure,
  useLocalStorage,
  useSessionStorage,
} from "@mantine/hooks"
import "maplibre-gl/dist/maplibre-gl.css"
import Map from "react-map-gl/maplibre"

// Redux
import { useSelector } from "react-redux"
import {
  selectFlightModeString,
  selectGPS,
  selectHomePosition,
} from "../../redux/slices/droneInfoSlice"
import { selectCurrentMissionItems } from "../../redux/slices/missionSlice"

// Helper scripts
import { intToCoord } from "../../helpers/dataFormatters"
import { filterMissionItems } from "../../helpers/filterMissions"
import {
  showErrorNotification,
  showNotification,
  showSuccessNotification,
} from "../../helpers/notification"
import { useSettings } from "../../helpers/settings"
import { socket } from "../../helpers/socket"

// Other dashboard imports
import ContextMenuItem from "../mapComponents/contextMenuItem"
import DroneMarker from "../mapComponents/droneMarker"
import MarkerPin from "../mapComponents/markerPin"
import MissionItems from "../mapComponents/missionItems"
import useContextMenu from "../mapComponents/useContextMenu"

// Tailwind styling
import { envelope, featureCollection, point } from "@turf/turf"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"
import FenceItems from "../mapComponents/fenceItems"
import HomeMarker from "../mapComponents/homeMarker"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const coordsFractionDigits = 7

function MapSectionNonMemo({ passedRef, onDragstart, mapId = "dashboard" }) {
  // Redux
  const connected = useSelector(selectConnectedToDrone)
  const gpsData = useSelector(selectGPS)
  const missionItems = useSelector(selectCurrentMissionItems)
  const homePosition = useSelector(selectHomePosition) // use actual home position
  const flightModeString = useSelector(selectFlightModeString)

  const [position, setPosition] = useState(null)
  const [firstCenteredToDrone, setFirstCenteredToDrone] = useState(false)
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

  const [repositionAltitude, setRepositionAltitude] = useLocalStorage({
    key: "repositionAltitude",
    defaultValue: 30,
  })

  const [filteredMissionItems, setFilteredMissionItems] = useState([])

  const contextMenuRef = useRef()
  const { clicked, setClicked, points, setPoints } = useContextMenu()
  const [
    contextMenuPositionCalculationInfo,
    setContextMenuPositionCalculationInfo,
  ] = useState()
  const [clickedGpsCoords, setClickedGpsCoords] = useState({ lng: 0, lat: 0 })

  const [opened, { open, close }] = useDisclosure(false)
  const clipboard = useClipboard({ timeout: 500 })

  const [guidedModePinData, setGuidedModePinData] = useSessionStorage({
    key: "guidedModePinData",
    defaultValue: null,
  })

  useEffect(() => {
    socket.on("nav_reposition_result", (msg) => {
      if (!msg.success) {
        showErrorNotification(msg.message)
      } else {
        showSuccessNotification(msg.message)
        setGuidedModePinData(msg.data)
      }
    })

    return () => {
      socket.off("nav_reposition_result")
    }
  }, [connected])

  useEffect(() => {
    // Check latest gpsData point is valid
    if (
      isNaN(gpsData.lat) ||
      isNaN(gpsData.lon) ||
      gpsData.lon === 0 ||
      gpsData.lat === 0
    )
      return

    // Move drone icon on map
    let lat = intToCoord(gpsData.lat)
    let lon = intToCoord(gpsData.lon)
    setPosition({ latitude: lat, longitude: lon })

    if (!firstCenteredToDrone && passedRef.current !== null) {
      passedRef.current.getMap().flyTo({
        center: [lon, lat],
        zoom: initialViewState.zoom,
      })
      setFirstCenteredToDrone(true)
    }
  }, [gpsData])

  useEffect(() => {
    setFilteredMissionItems(filterMissionItems(missionItems.mission_items))
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

  function reposition() {
    socket.emit("reposition", {
      lat: clickedGpsCoords.lat,
      lon: clickedGpsCoords.lng,
      alt: repositionAltitude,
    })
  }

  function zoomToDrone() {
    if (passedRef.current && position) {
      passedRef.current.getMap().flyTo({
        center: [position.longitude, position.latitude],
        zoom: 17,
      })
    }
  }

  function zoomToMission() {
    if (passedRef.current && filteredMissionItems.length > 0) {
      const filteredCoords = filteredMissionItems.map((item) =>
        point([intToCoord(item.y), intToCoord(item.x)]),
      )
      const features = featureCollection(filteredCoords)
      const boundingBox = envelope(features).bbox

      passedRef.current.getMap().fitBounds(
        [
          [boundingBox[0], boundingBox[1]],
          [boundingBox[2], boundingBox[3]],
        ],
        {
          padding: 150,
        },
      )
    }
  }

  function zoomToHome() {
    if (
      passedRef.current &&
      homePosition &&
      homePosition.lat !== 0 &&
      homePosition.lon !== 0
    ) {
      passedRef.current.getMap().flyTo({
        center: [intToCoord(homePosition.lon), intToCoord(homePosition.lat)],
        zoom: 17,
      })
    }
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
        cursor="default"
      >
        {/* Show marker on map if the position is set */}
        {position !== null &&
          !isNaN(position?.latitude) &&
          !isNaN(position?.longitude) && (
            <DroneMarker
              lat={position.latitude}
              lon={position.longitude}
              zoom={initialViewState.zoom}
              showHeadingLine={true}
            />
          )}

        <MissionItems missionItems={missionItems.mission_items} />

        <FenceItems fenceItems={missionItems.fence_items} />

        {/* Show mission rally point */}
        {missionItems.rally_items.map((item, index) => {
          return (
            <MarkerPin
              key={index}
              lat={intToCoord(item.x)}
              lon={intToCoord(item.y)}
              colour={tailwindColors.purple[400]}
              tooltipText={item.z ? `Alt: ${item.z}` : null}
            />
          )
        })}

        {flightModeString === "Guided" && guidedModePinData !== null && (
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
        {homePosition !== null &&
          homePosition.lat !== 0 &&
          homePosition.lon !== 0 && (
            <HomeMarker
              lat={intToCoord(homePosition.lat)}
              lon={intToCoord(homePosition.lon)}
              lineTo={
                filteredMissionItems.length > 0 && [
                  intToCoord(filteredMissionItems[0].y),
                  intToCoord(filteredMissionItems[0].x),
                ]
              }
            />
          )}

        <Modal opened={opened} onClose={close} title="Enter altitude" centered>
          <form
            className="flex flex-col space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              reposition()
              close()
            }}
          >
            <NumberInput
              placeholder="Altitude (m)"
              value={repositionAltitude}
              onChange={setRepositionAltitude}
              min={0}
              allowNegative={false}
              hideControls
              data-autofocus
            />
            <Button fullWidth type="submit">
              Reposition
            </Button>
          </form>
        </Modal>

        {clicked && (
          <div
            ref={contextMenuRef}
            className="absolute bg-falcongrey-700 rounded-md p-1"
            style={{ top: points.y, left: points.x }}
          >
            <ContextMenuItem onClick={zoomToDrone}>
              <p>Zoom to drone</p>
            </ContextMenuItem>
            <ContextMenuItem onClick={zoomToMission}>
              <p>Zoom to mission</p>
            </ContextMenuItem>
            <ContextMenuItem onClick={zoomToHome}>
              <p>Zoom to home</p>
            </ContextMenuItem>
            <Divider className="my-1" />
            <ContextMenuItem onClick={open}>Fly to here</ContextMenuItem>
            <Divider className="my-1" />
            <ContextMenuItem
              onClick={() => {
                clipboard.copy(
                  `${clickedGpsCoords.lat}, ${clickedGpsCoords.lng}`,
                )
                showNotification("Copied to clipboard")
              }}
            >
              <div className="w-full flex justify-between gap-2">
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
              </div>
            </ContextMenuItem>
          </div>
        )}
      </Map>
    </div>
  )
}
function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const MapSection = React.memo(MapSectionNonMemo, propsAreEqual)

export default MapSection
