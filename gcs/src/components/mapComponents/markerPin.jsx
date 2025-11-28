/*
  A component to display a marker pin on a map
*/

// Base imports
import React from "react"

// Map and mantine imports
import { Tooltip } from "@mantine/core"
import { Marker } from "react-map-gl"
import { useDispatch } from "react-redux"
import { coordToInt } from "../../helpers/dataFormatters"
import {
  updateContextMenuState,
  updateDrawingItem,
} from "../../redux/slices/missionSlice"

const MarkerPin = React.memo(
  ({
    id,
    lat,
    lon,
    colour,
    text = null,
    tooltipText = null,
    showOnTop = false,
    draggable = false,
    dragEndCallback = null,
  }) => {
    const dispatch = useDispatch()

    return (
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          dispatch(
            updateContextMenuState({
              isOpen: true,
              position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }, // map container-relative coords
              gpsCoords: { lat: lat, lng: lon },
              markerId: id,
            }),
          )
        }}
      >
        <Marker
          latitude={lat}
          longitude={lon}
          className={showOnTop && "z-10"}
          offset={[0, -15]}
          draggable={draggable}
          onDragEnd={(e) => {
            if (dragEndCallback !== null) {
              dragEndCallback({ x: e.lngLat.lat, y: e.lngLat.lng })
            } else {
              dispatch(
                updateDrawingItem({
                  id: id,
                  x: coordToInt(e.lngLat.lat),
                  y: coordToInt(e.lngLat.lng),
                }),
              )
            }
          }}
        >
          <Tooltip disabled={tooltipText === null} label={tooltipText}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill={colour}
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-map-pin text-black"
            >
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
              {text && (
                <text textAnchor="middle" x="12" y="14" className="text-black">
                  {text}
                </text>
              )}
            </svg>
          </Tooltip>
        </Marker>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  },
)

export default MarkerPin
