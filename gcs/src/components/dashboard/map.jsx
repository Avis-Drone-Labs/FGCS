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

export default function MapSection({ passedRef, data, heading, missionItems }) {
  const [position, setPosition] = useState({
    latitude: 53.381655,
    longitude: -1.481434,
  })
  const [firstCenteredToDrone, setFirstCenteredToDrone] = useState(false)
  const [defaultLat, setDefaultLat] = useState(53.381655)
  const [defaultLon, setDefaultLon] = useState(-1.481434)

  useEffect(() => {
    // Check latest data point is valid
    if (isNaN(data.lat) || isNaN(data.lon) || data.lon === 0 || data.lat === 0)
      return

    // Move drone icon on map
    let lat = intToCoord(data.lat)
    let lon = intToCoord(data.lon)
    setPosition({ latitude: lat, longitude: lon })

    // Update default lat and lon if they're ready to be updated
    if (!isNaN(defaultLat) || !isNaN(defaultLon)) {
      setDefaultLat(lat)
      setDefaultLon(lon)

      if (!firstCenteredToDrone) {
        passedRef.current.getMap().flyTo({
          center: [lon, lat],
          zoom: 16,
        })
        setFirstCenteredToDrone(true)
      }
    }
  }, [data])

  return (
    <div className='w-initial h-full' id='map'>
      <Map
        initialViewState={{
          latitude: defaultLat,
          longitude: defaultLon,
          zoom: 16,
        }}
        mapStyle={`https://api.maptiler.com/maps/8ff50749-c346-42f6-be2b-39d85c9c330d/style.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`}
        ref={passedRef}
        attributionControl={false}
        dragRotate={false}
        touchRotate={false}
      >
        {/* Show marker on map if the position is set */}
        {!isNaN(position?.latitude) && !isNaN(position?.longitude) && (
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
