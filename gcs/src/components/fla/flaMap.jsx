/*
  The FLA map.
*/

import { envelope, featureCollection, point } from "@turf/turf"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { useMemo, useRef } from "react"
import Map, { Marker } from "react-map-gl/maplibre"
import { useSelector } from "react-redux"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import { intToCoord } from "../../helpers/dataFormatters"
import { useSettings } from "../../helpers/settings"
import { selectMapPositionData } from "../../redux/slices/logAnalyserSlice"
import DrawLineCoordinates from "../mapComponents/drawLineCoordinates"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function FlaMapSectionNonMemo({ hoverPosition }) {
  const mapPositionData = useSelector(selectMapPositionData)
  const mapPositionDataBounds = useMemo(() => {
    let dataSource = null
    if (mapPositionData.gps?.length) {
      dataSource = mapPositionData.gps
    } else if (mapPositionData.gps2?.length) {
      dataSource = mapPositionData.gps2
    } else if (mapPositionData.pos?.length) {
      dataSource = mapPositionData.pos
    }

    if (dataSource) {
      const boundingEnvelope = envelope(
        featureCollection(
          dataSource.map((gpsPoint) =>
            point([intToCoord(gpsPoint.lon), intToCoord(gpsPoint.lat)]),
          ),
        ),
      )
      return [
        [boundingEnvelope.bbox[0], boundingEnvelope.bbox[1]],
        [boundingEnvelope.bbox[2], boundingEnvelope.bbox[3]],
      ]
    }
    return null
  }, [mapPositionData])

  const { getSetting } = useSettings()
  const ref = useRef()

  return (
    <div className="w-initial h-full" id="map">
      <Map
        mapStyle={`https://api.maptiler.com/maps/satellite/style.json?key=${getSetting("General.maptilerAPIKey") || import.meta.env.VITE_MAPTILER_API_KEY}`}
        ref={ref}
        attributionControl={false}
        dragRotate={false}
        touchRotate={false}
        cursor="default"
        initialViewState={
          mapPositionDataBounds !== null
            ? {
                bounds: mapPositionDataBounds,
                fitBoundsOptions: {
                  padding: 100,
                },
              }
            : undefined
        }
      >
        {mapPositionData.gps?.length > 1 && (
          <DrawLineCoordinates
            coordinates={mapPositionData.gps.map((point) => [
              intToCoord(point.lon),
              intToCoord(point.lat),
            ])}
            colour={tailwindColors.yellow[400]}
          />
        )}
        {mapPositionData.gps2?.length > 1 && (
          <DrawLineCoordinates
            coordinates={mapPositionData.gps2.map((point) => [
              intToCoord(point.lon),
              intToCoord(point.lat),
            ])}
            colour={tailwindColors.red[400]}
          />
        )}
        {mapPositionData.pos?.length > 1 && (
          <DrawLineCoordinates
            coordinates={mapPositionData.pos.map((point) => [
              intToCoord(point.lon),
              intToCoord(point.lat),
            ])}
            colour={tailwindColors.blue[400]}
          />
        )}

        {/* Drone marker at hover position */}
        {hoverPosition && (
          <Marker
            longitude={intToCoord(hoverPosition.lon)}
            latitude={intToCoord(hoverPosition.lat)}
            anchor="center"
          >
            <div className="relative">
              {/* Drone icon - using a simple SVG plane/drone shape */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                {/* Simple drone/plane icon */}
                <path
                  d="M12 2L15 8H21L16 12L18 18L12 15L6 18L8 12L3 8H9L12 2Z"
                  fill="#FF6B6B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Marker>
        )}

        <div className="absolute top-0 right-0 bg-falcongrey-TRANSLUCENT cursor-default flex flex-row gap-2 p-1 select-none">
          <p className="text-yellow-400">GPS</p>
          <p className="text-red-400">GPS2</p>
          <p className="text-blue-400">POS</p>
        </div>

        <div className="absolute top-10 right-0 bg-falcongrey-TRANSLUCENT cursor-default flex flex-row gap-2 p-1 select-none">
          <p className="text-yellow-400">{hoverPosition?.lon}</p>
          <p className="text-yellow-400">{hoverPosition?.lat}</p>
        </div>
      </Map>
    </div>
  )
}

const FlaMapSection = React.memo(FlaMapSectionNonMemo)

export default FlaMapSection
