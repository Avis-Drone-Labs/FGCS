/*
  Right hand side floating toolbar. This holds toggles like dark mode and anchoring.
*/

// 3rd Party Imports
import { ActionIcon, Tooltip, } from "@mantine/core"
import { IconAnchor, IconAnchorOff, IconCrosshair, IconMapPins, IconSun, IconSunOff } from "@tabler/icons-react"

// Tailwind styling
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors


export default function FloatingToolbar({}) {
  // Delete these
  var outsideVisibility = true
  var followDrone = true

  var outsideVisibilityColor = outsideVisibility
    ? tailwindColors.falcongrey['900']
    : tailwindColors.falcongrey['TRANSLUCENT']

  return (
    <div
      className='absolute right-0 top-1/2 py-4 px-2 rounded-tl-md rounded-bl-md flex flex-col gap-2 z-30'
      style={{ backgroundColor: outsideVisibilityColor }}
    >
      {/* Follow Drone */}
      <Tooltip
        // label={
        //   !gpsData.lon && !gpsData.lat
        //     ? 'No GPS data'
        //     : followDrone
        //       ? 'Stop following'
        //       : 'Follow drone'
        // }
      >
        <ActionIcon
          // disabled={!gpsData.lon && !gpsData.lat}
          // onClick={() => {
          //   setFollowDrone(
          //     followDrone
          //       ? false
          //       : (() => {
          //           if (
          //             mapRef.current &&
          //             gpsData?.lon !== 0 &&
          //             gpsData?.lat !== 0
          //           ) {
          //             let lat = parseFloat(gpsData.lat * 1e-7)
          //             let lon = parseFloat(gpsData.lon * 1e-7)
          //             mapRef.current.setCenter({ lng: lon, lat: lat })
          //           }
          //           return true
          //         })(),
          //   )
          // }}
        >
          {followDrone ? <IconAnchorOff /> : <IconAnchor />}
        </ActionIcon>
      </Tooltip>

      {/* Center Map on Drone */}
      <Tooltip
        // label={!gpsData.lon && !gpsData.lat ? 'No GPS data' : 'Center on drone'}
      >
        <ActionIcon
          // disabled={!gpsData.lon && !gpsData.lat}
          // onClick={centerMapOnDrone}
        >
          <IconCrosshair />
        </ActionIcon>
      </Tooltip>

      {/* Center Map on first mission item */}
      <Tooltip
        // label={
        //   !missionItems.mission_items.length > 0
        //     ? 'No mission'
        //     : 'Center on mission'
        // }
      >
        <ActionIcon
          // disabled={missionItems.mission_items.length <= 0}
          // onClick={centerMapOnFirstMissionItem}
        >
          <IconMapPins />
        </ActionIcon>
      </Tooltip>

      {/* Set outside visibility */}
      <Tooltip
        label={
          outsideVisibility
            ? 'Turn off outside text mode'
            : 'Turn on outside text mode'
        }
      >
        <ActionIcon
          // onClick={() => {
          //   setOutsideVisibility(!outsideVisibility)
          // }}
        >
          {outsideVisibility ? <IconSun /> : <IconSunOff />}
        </ActionIcon>
      </Tooltip>
    </div>
  )
}
