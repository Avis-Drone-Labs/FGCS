/*
  The FLA map.
*/

import { envelope, featureCollection, point } from "@turf/turf"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { useMemo, useRef } from "react"
import Map from "react-map-gl/maplibre"
import { useSelector } from "react-redux"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import { intToCoord } from "../../helpers/dataFormatters"
import { useSettings } from "../../helpers/settings"
import { selectMapPositionData } from "../../redux/slices/logAnalyserSlice"
import DrawLineCoordinates from "../mapComponents/drawLineCoordinates"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function FlaMapSectionNonMemo() {
  const mapPositionData = useSelector(selectMapPositionData)
  const mapPositionDataBounds = useMemo(() => {
    let dataSource = null
    if (mapPositionData.gps.length) {
      dataSource = mapPositionData.gps
    } else if (mapPositionData.gps2.length) {
      dataSource = mapPositionData.gps2
    } else if (mapPositionData.pos.length) {
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
        initialViewState={{
          bounds: mapPositionDataBounds,
          fitBoundsOptions: {
            padding: 100,
          },
        }}
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

        <div className="absolute top-0 right-0 bg-falcongrey-TRANSLUCENT cursor-default flex flex-row gap-2 p-1 select-none">
          <p className="text-yellow-400">GPS</p>
          <p className="text-red-400">GPS2</p>
          <p className="text-blue-400">POS</p>
        </div>
      </Map>
    </div>
  )
}

function propsAreEqual(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next)
}
const FlaMapSection = React.memo(FlaMapSectionNonMemo, propsAreEqual)

export default FlaMapSection
