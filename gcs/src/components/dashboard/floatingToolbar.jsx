/*
  Right hand side floating toolbar. This holds toggles like dark mode and anchoring.
*/

// 3rd Party Imports
import { ActionIcon, Tooltip } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { IconAnchor, IconAnchorOff, IconCrosshair, IconMapPins, IconSun, IconSunOff } from "@tabler/icons-react"

export default function FloatingToolbar({
  outsideVisibilityColor,
  centerMapOnFirstMissionItem,
  missionItems,
  centerMapOnDrone,
  gpsData,
  followDrone,
  updateFollowDroneAction
}) {
  const [outsideVisibility, setOutsideVisibility] = useLocalStorage({
    key: "outsideVisibility",
    defaultValue: false
  })

  return (
    <div
      className='absolute right-0 top-1/2 py-4 px-2 rounded-tl-md rounded-bl-md flex flex-col gap-2 z-30'
      style={{ backgroundColor: outsideVisibilityColor }}
    >
      {/* Follow Drone */}
      <Tooltip
        label={
          !gpsData.lon && !gpsData.lat
            ? 'No GPS data'
            : followDrone
              ? 'Stop following'
              : 'Follow drone'
        }
      >
        <ActionIcon
          disabled={!gpsData.lon && !gpsData.lat}
          onClick={() => {updateFollowDroneAction}}
        >
          {followDrone ? <IconAnchorOff /> : <IconAnchor />}
        </ActionIcon>
      </Tooltip>

      {/* Center Map on Drone */}
      <Tooltip
        label={!gpsData.lon && !gpsData.lat ? 'No GPS data' : 'Center on drone'}
      >
        <ActionIcon
          disabled={!gpsData.lon && !gpsData.lat}
          onClick={centerMapOnDrone}
        >
          <IconCrosshair />
        </ActionIcon>
      </Tooltip>

      {/* Center Map on first mission item */}
      <Tooltip
        label={
          !missionItems.mission_items.length > 0
            ? 'No mission'
            : 'Center on mission'
        }
      >
        <ActionIcon
          disabled={missionItems.mission_items.length <= 0}
          onClick={centerMapOnFirstMissionItem}
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
          onClick={() => {
            setOutsideVisibility(!outsideVisibility)
          }}
        >
          {outsideVisibility ? <IconSun /> : <IconSunOff />}
        </ActionIcon>
      </Tooltip>
    </div>
  )
}
