/*
  The dashboard map.

  This uses maplibre to load the map, currently (as of 23/04/2024) this needs an internet
  connection to load but this will be addressed in later versions of FGCS. Please check
  docs/changelogs if this description has not been updated.
*/

// Base imports
import { useEffect, useState } from 'react'

// Maplibre and mantine imports
import { Tooltip } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import 'maplibre-gl/dist/maplibre-gl.css'
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre'

import arrow from '../../assets/arrow.svg'

// Tailwind styling
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Convert coordinates from mavlink into gps coordinates
function intToCoord(val) {
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

export default function MapSection({
  passedRef,
  data,
  heading,
  desiredBearing,
  missionItems,
}) {
  const [position, setPosition] = useState(null)
  const [firstCenteredToDrone, setFirstCenteredToDrone] = useState(false)
  const [initialViewState, setInitialViewState] = useLocalStorage({
    key: 'initialViewState',
    defaultValue: { latitude: 53.381655, longitude: -1.481434, zoom: 17 },
    getInitialValueInEffect: false,
  })

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

        {/* Show mission item LABELS */}
        {missionItems.mission_items.map((item, index) => {
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
                  fill={tailwindColors.yellow[400]}
                  stroke='currentColor'
                  strokeWidth='1'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black'
                >
                  <path d='M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z' />
                  <text
                    textAnchor='middle'
                    x='12'
                    y='14'
                    className='text-black'
                  >
                    {item.seq}
                  </text>
                </svg>
              </Tooltip>
            </Marker>
          )
        })}

        {/* Show mission item outlines */}
        {missionItems.mission_items.length > 0 && (
          <Source
            type='geojson'
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  ...missionItems.mission_items.map((item) => [
                    intToCoord(item.y),
                    intToCoord(item.x),
                  ]),
                  [
                    intToCoord(missionItems.mission_items[0].y),
                    intToCoord(missionItems.mission_items[0].x),
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
      </Map>
    </div>
  )
}
