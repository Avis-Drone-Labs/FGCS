import 'maplibre-gl/dist/maplibre-gl.css'

import Map, { Marker } from 'react-map-gl'
import { useEffect, useState } from 'react'

import maplibregl from 'maplibre-gl'

function MapInformationPanel({ data }) {
  return (
    <div className="z-10 relative bg-falcongrey/80 w-1/2 p-4 rounded-br-lg">
      <div className="flex flex-col">
        {Object.keys(data).map((name, i) => {
          let value = data[name]
          return (
            <div key={i} className="">
              <span className="w-40 inline-block uppercase text-neutral-200">
                {name}
              </span>
              <span className="text-neutral-50">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MapSection({ data }) {
  const [position, setPosition] = useState({})

  useEffect(() => {
    setPosition({ lat: data['lat'], lon: data['lng'] })
  }, [data])

  return (
    <div className="w-initial h-[34rem] m-2 pt-4 pb-[0.55rem]" id="map">
      <Map
        mapLib={maplibregl}
        initialViewState={{
          latitude: 52.780812,
          longitude: -0.707359,
          zoom: 7,
        }}
        mapStyle={`https://api.maptiler.com/maps/8ff50749-c346-42f6-be2b-39d85c9c330d/style.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`}
        style={{ borderRadius: '0.5rem' }}
      >
        {position && position.lat && position.lon && (
          <Marker latitude={position.lat} longitude={position.lon} scale={0.1}>
            <img src="/drone_1.png" className="w-10 h-10" />
          </Marker>
        )}
        <MapInformationPanel data={data} />
      </Map>
    </div>
  )
}
