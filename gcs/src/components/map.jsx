import 'maplibre-gl/dist/maplibre-gl.css'

import Map, { Marker } from 'react-map-gl'
import { useEffect, useState } from 'react'

import maplibregl from 'maplibre-gl'

function MapInformationPanel({ data }) {
  // TODO: Change to display satellites visible, GPS fix
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
  const [defaultLat, setDefaultLat] = useState(null)
  const [defaultLon, setDefaultLon] = useState(null)

  useEffect(() => {
    if (isNaN(data.lat) || isNaN(data.lon)) return
    let lat = data.lat * 1e-7
    let lon = data.lon * 1e-7
    setPosition({ latitude: lat, longitude: lon })
    if (!isNaN(defaultLat) || !isNaN(defaultLon)) {
      setDefaultLat(lat)
      setDefaultLon(lon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className="w-initial h-full m-2 pb-[0.55rem]" id="map">
      {!isNaN(position?.latitude) && !isNaN(position?.longitude) && (
        <Map
          mapLib={maplibregl}
          initialViewState={{
            latitude: defaultLat,
            longitude: defaultLon,
            zoom: 16,
          }}
          mapStyle={`https://api.maptiler.com/maps/8ff50749-c346-42f6-be2b-39d85c9c330d/style.json?key=${
            import.meta.env.VITE_MAPTILER_API_KEY
          }`}
          style={{ borderRadius: '0.5rem' }}
        >
          <Marker
            latitude={position.latitude}
            longitude={position.longitude}
            scale={0.1}
          >
            <img src="/drone_1.png" className="w-10 h-10" />
          </Marker>
          <MapInformationPanel data={data} />
        </Map>
      )}
    </div>
  )
}
