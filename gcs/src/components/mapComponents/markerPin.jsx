/*
  A component to display a marker pin on a map
*/

// Base imports
import React from "react"

// Map and mantine imports
import { Tooltip } from "@mantine/core"
import { Marker } from "react-map-gl"
import { coordToInt } from "../../helpers/dataFormatters"

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
    dragEndCallback = () => {},
  }) => {
    return (
      <Marker
        latitude={lat}
        longitude={lon}
        className={showOnTop && "z-10"}
        draggable={draggable}
        onDragEnd={(e) => {
          dragEndCallback({
            id: id,
            x: coordToInt(e.lngLat.lat),
            y: coordToInt(e.lngLat.lng),
          })
        }}
      >
        <Tooltip disabled={tooltipText === null} label={tooltipText}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 48"
            fill={colour}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-map-pin h-16 w-16 text-black"
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
    )
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  },
)

export default MarkerPin
