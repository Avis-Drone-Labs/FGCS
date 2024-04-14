import 'maplibre-gl/dist/maplibre-gl.css'

import { Tooltip } from '@mantine/core'
import { useEffect, useState } from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function intToCoord(val) {
  return val * 1e-7
}

export default function MapSection({ passedRef, data, heading, missionItems }) {
  const [position, setPosition] = useState({
    latitude: 53.381655,
    longitude: -1.481434,
  })
  const [defaultLat, setDefaultLat] = useState(53.381655)
  const [defaultLon, setDefaultLon] = useState(-1.481434)

  useEffect(() => {
    if (isNaN(data.lat) || isNaN(data.lon) || data.lon === 0 || data.lat === 0)
      return
    let lat = intToCoord(data.lat)
    let lon = intToCoord(data.lon)
    setPosition({ latitude: lat, longitude: lon })
    if (!isNaN(defaultLat) || !isNaN(defaultLon)) {
      setDefaultLat(lat)
      setDefaultLon(lon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className='w-initial h-full' id='map'>
      {/* Map */}
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
      >
        {!isNaN(position?.latitude) && !isNaN(position?.longitude) && (
          <Marker
            latitude={position.latitude}
            longitude={position.longitude}
            scale={0.1}
          >
            <img
              src='/arrow.svg'
              className='w-6 h-6'
              style={{ transform: `rotate(${heading ?? 0}deg)` }}
            />
          </Marker>
        )}
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
      </Map>
    </div>
  )
}
