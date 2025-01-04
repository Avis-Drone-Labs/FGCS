/*
  The dashboard map.

  This uses maplibre to load the map, currently (as of 23/04/2024) this needs an internet
  connection to load but this will be addressed in later versions of FGCS. Please check
  docs/changelogs if this description has not been updated.
*/

// Base imports
import { useEffect, useRef, useState } from 'react'

// Maplibre and mantine imports
import { Button, Divider, Modal, NumberInput, Tooltip } from '@mantine/core'
import {
  useClipboard,
  useDisclosure,
  useLocalStorage,
  useSessionStorage,
} from '@mantine/hooks'
import 'maplibre-gl/dist/maplibre-gl.css'
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre'

import arrow from '../../assets/arrow.svg'

// Tailwind styling
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
import { FILTER_MISSION_ITEM_COMMANDS_LIST } from '../../helpers/mavlinkConstants'
import {
  showErrorNotification,
  showNotification,
  showSuccessNotification,
} from '../../helpers/notification'
import { socket } from '../../helpers/socket'
import ContextMenuItem from './contextMenuItem'
import MissionItems from './missionItems'
import useContextMenu from './useContextMenu'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Convert coordinates from mavlink into gps coordinates
export function intToCoord(val) {
  return val * 1e-7
}

function degToRad(deg) {
  return deg * (Math.PI / 180)
}

function radToDeg(rad) {
  return rad * (180 / Math.PI)
}

function getPointAtDistance(lat1, lon1, distance, bearing) {
  // https://stackoverflow.com/questions/7222382/get-lat-long-given-current-point-distance-and-bearing

  const R = 6378.14 // Radius of the Earth in km
  const brng = degToRad(bearing)
  const lat1Rad = degToRad(lat1)
  const lon1Rad = degToRad(lon1)
  const lat2 = Math.asin(
    Math.sin(lat1Rad) * Math.cos(distance / R) +
      Math.cos(lat1Rad) * Math.sin(distance / R) * Math.cos(brng),
  )
  const lon2 =
    lon1Rad +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1Rad),
      Math.cos(distance / R) - Math.sin(lat1Rad) * Math.sin(lat2),
    )

  return [radToDeg(lat2), radToDeg(lon2)]
}

export function filterMissionItems(missionItems) {
  return missionItems.filter(
    (missionItem) =>
      !Object.values(FILTER_MISSION_ITEM_COMMANDS_LIST).includes(
        missionItem.command,
      ),
  )
}

export default function MapSection({
  passedRef,
  data,
  heading,
  desiredBearing,
  missionItems,
  homePosition,
  onDragstart,
  getFlightMode,
}) {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  const [position, setPosition] = useState(null)
  const [firstCenteredToDrone, setFirstCenteredToDrone] = useState(false)
  const [initialViewState, setInitialViewState] = useLocalStorage({
    key: 'initialViewState',
    defaultValue: { latitude: 53.381655, longitude: -1.481434, zoom: 17 },
    getInitialValueInEffect: false,
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

  const [repositionAltitude, setRepositionAltitude] = useLocalStorage({
    key: 'repositionAltitude',
    defaultValue: 30,
  })
  const [guidedModePinData, setGuidedModePinData] = useSessionStorage({
    key: 'guidedModePinData',
    defaultValue: null,
  })

  useEffect(() => {
    socket.on('nav_reposition_result', (msg) => {
      if (!msg.success) {
        showErrorNotification(msg.message)
      } else {
        showSuccessNotification(msg.message)
        setGuidedModePinData(msg.data)
      }
    })

    return () => {
      socket.off('nav_reposition_result')
    }
  }, [connected])

  useEffect(() => {
    // Check latest data point is valid
    if (isNaN(data.lat) || isNaN(data.lon) || data.lon === 0 || data.lat === 0)
      return

    // Move drone icon on map
    let lat = intToCoord(data.lat)
    let lon = intToCoord(data.lon)
    setPosition({ latitude: lat, longitude: lon })

    if (!firstCenteredToDrone) {
      passedRef.current.getMap().flyTo({
        center: [lon, lat],
        zoom: initialViewState.zoom,
      })
      setFirstCenteredToDrone(true)
    }
  }, [data])

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
    socket.emit('reposition', {
      lat: clickedGpsCoords.lat,
      lon: clickedGpsCoords.lng,
      alt: repositionAltitude,
    })
  }

  return (
    <div className='w-initial h-full' id='map'>
      <Map
        initialViewState={initialViewState}
        mapStyle={`https://api.maptiler.com/maps/8ff50749-c346-42f6-be2b-39d85c9c330d/style.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`}
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
        cursor='default'
      >
        {/* Show marker on map if the position is set */}
        {position !== null &&
          !isNaN(position?.latitude) &&
          !isNaN(position?.longitude) && (
            <>
              <Marker
                latitude={position.latitude}
                longitude={position.longitude}
                scale={0.1}
              >
                <img
                  src={arrow}
                  className='w-6 h-6'
                  style={{ transform: `rotate(${heading ?? 0}deg)` }}
                />
              </Marker>

              <Source
                type='geojson'
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [position.longitude, position.latitude],
                      getPointAtDistance(
                        position.latitude,
                        position.longitude,
                        25000 / 2 ** initialViewState.zoom,
                        desiredBearing ?? 0,
                      ).reverse(),
                    ],
                  },
                }}
              >
                <Layer
                  {...{
                    type: 'line',
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round',
                    },
                    paint: {
                      'line-color': tailwindColors.red[200],
                      'line-width': 3,
                    },
                  }}
                />
              </Source>
              <Source
                type='geojson'
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [position.longitude, position.latitude],
                      getPointAtDistance(
                        position.latitude,
                        position.longitude,
                        25000 / 2 ** initialViewState.zoom,
                        heading ?? 0,
                      ).reverse(),
                    ],
                  },
                }}
              >
                <Layer
                  {...{
                    type: 'line',
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round',
                    },
                    paint: {
                      'line-color': tailwindColors.blue[200],
                      'line-width': 3,
                    },
                  }}
                />
              </Source>
            </>
          )}

        {/* Show home position */}
        {homePosition !== null && (
          <>
            <Marker
              longitude={intToCoord(homePosition.lon)}
              latitude={intToCoord(homePosition.lat)}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 48'
                fill={tailwindColors.green[400]}
                stroke='currentColor'
                strokeWidth='1'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black'
              >
                <path d='M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z' />
                <text textAnchor='middle' x='12' y='14' className='text-black'>
                  H
                </text>
              </svg>
            </Marker>
            {filteredMissionItems.length > 0 && (
              <Source
                type='geojson'
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [
                        intToCoord(homePosition.lon),
                        intToCoord(homePosition.lat),
                      ],
                      [
                        intToCoord(filteredMissionItems[0].y),
                        intToCoord(filteredMissionItems[0].x),
                      ],
                    ],
                  },
                }}
              >
                <Layer
                  {...{
                    type: 'line',
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round',
                    },
                    paint: {
                      'line-color': tailwindColors.yellow[400],
                      'line-width': 1,
                    },
                  }}
                />
              </Source>
            )}
          </>
        )}

        <MissionItems missionItems={missionItems.mission_items} />

        {/* Show mission geo-fence MARKERS */}
        {missionItems.fence_items.map((item, index) => {
          return (
            <Marker
              key={index}
              longitude={intToCoord(item.y)}
              latitude={intToCoord(item.x)}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 48'
                fill={tailwindColors.blue[400]}
                stroke='currentColor'
                strokeWidth='1'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black'
              >
                <path d='M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z' />
              </svg>
            </Marker>
          )
        })}

        {/* Show geo-fence outlines */}
        {missionItems.fence_items.length > 0 && (
          <Source
            type='geojson'
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  ...missionItems.fence_items.map((item) => [
                    intToCoord(item.y),
                    intToCoord(item.x),
                  ]),
                  [
                    intToCoord(missionItems.fence_items[0].y),
                    intToCoord(missionItems.fence_items[0].x),
                  ],
                ],
              },
            }}
          >
            <Layer
              {...{
                type: 'line',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': tailwindColors.blue[200],
                  'line-width': 1,
                  'line-dasharray': [2, 2],
                },
              }}
            />
          </Source>
        )}

        {/* Show mission rally point */}
        {missionItems.rally_items.map((item, index) => {
          return (
            <Marker
              key={index}
              longitude={intToCoord(item.y)}
              latitude={intToCoord(item.x)}
            >
              <Tooltip label={`Alt: ${item.z}`}>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 48'
                  fill={tailwindColors.purple[400]}
                  stroke='currentColor'
                  strokeWidth='1'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black'
                >
                  <path d='M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z' />
                </svg>
              </Tooltip>
            </Marker>
          )
        })}

        {getFlightMode() === 'Guided' && guidedModePinData !== null && (
          <Marker
            longitude={guidedModePinData.lon}
            latitude={guidedModePinData.lat}
          >
            <Tooltip label={`Alt: ${guidedModePinData.alt}`}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 48'
                fill={tailwindColors.pink[500]}
                stroke='currentColor'
                strokeWidth='1'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black'
              >
                <path d='M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z' />
              </svg>
            </Tooltip>
          </Marker>
        )}

        <Modal opened={opened} onClose={close} title='Enter altitude' centered>
          <div className='flex flex-col space-y-2'>
            <NumberInput
              placeholder='Altitude (m)'
              value={repositionAltitude}
              onChange={setRepositionAltitude}
              min={0}
              allowNegative={false}
              hideControls
              data-autofocus
            />
            <Button
              fullWidth
              onClick={() => {
                reposition()
                close()
              }}
            >
              Reposition
            </Button>
          </div>
        </Modal>

        {clicked && (
          <div
            ref={contextMenuRef}
            className='absolute bg-falcongrey-700 rounded-md p-1'
            style={{ top: points.y, left: points.x }}
          >
            <ContextMenuItem text='Fly to here' onClick={open} />
            <Divider className='my-1' />
            <ContextMenuItem
              text='Copy coords'
              onClick={() => {
                clipboard.copy(
                  `${clickedGpsCoords.lat}, ${clickedGpsCoords.lng}`,
                )
                showNotification('Copied to clipboard')
              }}
            />
          </div>
        )}
      </Map>
    </div>
  )
}
