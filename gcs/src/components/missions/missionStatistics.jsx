/*
  The MissionStatistics component calculates and displays various statistics
  about the mission on the missions screen.
*/

import { Tooltip } from "@mantine/core"
import { distance } from "@turf/turf"
import { useEffect, useState } from "react"
import { intToCoord } from "../../helpers/dataFormatters"
import {
  filterMissionItems,
  isGlobalFrameHomeCommand,
} from "../../helpers/filterMissions"

// Redux
import { useSelector } from "react-redux"
import {
  selectDrawingMissionItems,
  selectPlannedHomePosition,
} from "../../redux/slices/missionSlice"

function calculateMaxAltitude(missionItems) {
  missionItems = missionItems.filter(
    (item) => isGlobalFrameHomeCommand(item) === false,
  )

  return Math.max(...missionItems.map((item) => item.z || 0), 0)
}

function calculateMaxDistanceBetweenWaypoints(missionItems) {
  missionItems = missionItems.filter(
    (item) => isGlobalFrameHomeCommand(item) === false,
  )
  if (missionItems.length < 2) return 0
  let maxDistance = 0
  let maxDistancePoints = []

  // Remove any waypoints without coordinates
  missionItems = missionItems.filter((item) => item.x !== 0 && item.y !== 0)

  for (let i = 0; i < missionItems.length - 1; i++) {
    const item1 = missionItems[i]
    const item2 = missionItems[i + 1]
    const distanceBetweenPoints = distance(
      [intToCoord(item1.y), intToCoord(item1.x)],
      [intToCoord(item2.y), intToCoord(item2.x)],
      {
        units: "meters",
      },
    )
    if (distanceBetweenPoints > maxDistance) {
      maxDistance = distanceBetweenPoints
      maxDistancePoints = [item1, item2]
    }
  }

  // distance to 2dp
  maxDistance = Math.round(maxDistance * 100) / 100

  return { maxDistance: maxDistance, points: maxDistancePoints }
}

function calculateMaxSlopeGradient(missionItems) {
  const homeCommand = isGlobalFrameHomeCommand(missionItems[0])
    ? missionItems[0]
    : null
  if (homeCommand) {
    missionItems = missionItems.slice(1) // Remove home command if it exists
  }

  if (missionItems.length < 2) return 0
  let maxGradient = 0
  let maxDistancePoints = []

  // If the first command is a takeoff command, use the coordinates from the home location
  if (homeCommand && missionItems[0].command === 22) {
    missionItems[0].x = homeCommand.x
    missionItems[0].y = homeCommand.y
  }

  for (let i = 0; i < missionItems.length - 1; i++) {
    const item1 = missionItems[i]
    const item2 = missionItems[i + 1]

    if (item1.z === undefined || item2.z === undefined) continue

    const verticalDistance = Math.abs(item2.z - item1.z)
    const horizontalDistance = distance(
      [intToCoord(item1.y), intToCoord(item1.x)],
      [intToCoord(item2.y), intToCoord(item2.x)],
      { units: "meters" },
    )

    if (horizontalDistance === 0) continue // Avoid division by zero

    const gradient = (verticalDistance / horizontalDistance) * 100 // Convert to percentage

    if (gradient > maxGradient) {
      maxGradient = gradient
      maxDistancePoints = [item1, item2]
    }
  }

  maxGradient = Math.round(maxGradient * 100) / 100 // Round to two decimal places

  return { maxGradient: maxGradient, points: maxDistancePoints }
}

function calculateTotalDistance(missionItems) {
  // This function should calculate the total distance of the waypoints,
  // ignoring any waypoints without coordinates. If the jump command (177) is present,
  // then the distance for all of the jump waypoints for the number of laps should
  // be calculated as well.
  let totalDistance = 0
  let lastPoint = null

  for (let i = 0; i < missionItems.length; i++) {
    const item = missionItems[i]

    if (item.command === 177) {
      const jumpTo = item.param1
      const jumpCount = item.param2

      // Find the waypoint with the seq value equal to jumpTo
      const jumpWaypoint = missionItems.find((wp) => wp.seq === jumpTo)

      if (jumpWaypoint) {
        // Calculate the distance from the jumpWaypoint to the current waypoint
        // times the number of jumps
        if (lastPoint) {
          totalDistance +=
            distance(
              [intToCoord(lastPoint.y), intToCoord(lastPoint.x)],
              [intToCoord(jumpWaypoint.y), intToCoord(jumpWaypoint.x)],
              { units: "meters" },
            ) * jumpCount
        }

        for (let j = 0; j < jumpCount; j++) {
          // Slice the missionItems list between the actual array index of jumpWaypoint and i
          const jumpStartIdx = missionItems.findIndex((wp) => wp.seq === jumpTo)
          const jumpItems = missionItems.slice(jumpStartIdx, i)
          totalDistance += calculateTotalDistance(jumpItems)
        }
      }
    }

    if (item.x === 0 || item.y === 0) continue // Skip waypoints without coordinates

    if (lastPoint) {
      totalDistance += distance(
        [intToCoord(lastPoint.y), intToCoord(lastPoint.x)],
        [intToCoord(item.y), intToCoord(item.x)],
        { units: "meters" },
      )
    }
    lastPoint = item
  }

  return Math.round(totalDistance * 100) / 100
}

function calculateMaxTelemDistance(missionItems, homePosition) {
  // Calculate the max distance from the home position
  if (missionItems.length === 0 || !homePosition)
    return { maxDistance: 0, point: null }

  let maxDistance = 0
  let maxDistancePoint = null

  // Remove any waypoints without coordinates
  missionItems = missionItems.filter((item) => item.x !== 0 && item.y !== 0)

  for (const item of missionItems) {
    const distanceFromHome = distance(
      [intToCoord(homePosition.lon), intToCoord(homePosition.lat)],
      [intToCoord(item.y), intToCoord(item.x)],
      { units: "meters" },
    )

    if (distanceFromHome > maxDistance) {
      maxDistance = distanceFromHome
      maxDistancePoint = item
    }
  }

  maxDistance = Math.round(maxDistance * 100) / 100 // Round to two decimal places
  return { maxDistance: maxDistance, point: maxDistancePoint }
}

function StatisticItem({ label, value, units, tooltip = null }) {
  const displayString = `${label}: ${value}${units || ""}`
  return (
    <>
      {tooltip ? (
        <Tooltip label={tooltip}>
          <p>{displayString}</p>
        </Tooltip>
      ) : (
        <p>{displayString}</p>
      )}
    </>
  )
}

export default function MissionStatistics() {
  const missionItems = useSelector(selectDrawingMissionItems)
  const plannedHomePosition = useSelector(selectPlannedHomePosition)

  const [filteredMissionItems, setFilteredMissionItems] = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [maxDistanceBetweenWaypoints, setMaxDistanceBetweenWaypoints] =
    useState({ maxDistance: 0, points: null })
  const [maxAltitude, setMaxAltitude] = useState(0)
  const [maxSlopeGradient, setMaxSlopeGradient] = useState({
    maxGradient: 0,
    points: null,
  })
  const [maxTelemDistance, setMaxTelemDistance] = useState({
    maxDistance: 0,
    point: null,
  })

  useEffect(() => {
    setFilteredMissionItems(filterMissionItems(missionItems))
  }, [missionItems])

  useEffect(() => {
    if (filteredMissionItems.length === 0) {
      setTotalDistance(0)
      setMaxAltitude(0)
      setMaxDistanceBetweenWaypoints({ maxDistance: 0, points: null })
      setMaxSlopeGradient({ maxGradient: 0, points: null })
      setMaxTelemDistance({ maxDistance: 0, point: null })
      return
    }

    // Use unfiltered mission items
    setTotalDistance(calculateTotalDistance(missionItems))
    setMaxAltitude(calculateMaxAltitude(filteredMissionItems))
    setMaxDistanceBetweenWaypoints(
      calculateMaxDistanceBetweenWaypoints(filteredMissionItems),
    )
    setMaxSlopeGradient(calculateMaxSlopeGradient(filteredMissionItems))
    setMaxTelemDistance(
      calculateMaxTelemDistance(filteredMissionItems, plannedHomePosition),
    )
  }, [filteredMissionItems, plannedHomePosition])

  return (
    <>
      <StatisticItem label="Total distance" value={totalDistance} units="m" />
      <StatisticItem
        label="Max distance between waypoints"
        value={maxDistanceBetweenWaypoints.maxDistance}
        tooltip={
          maxDistanceBetweenWaypoints.points &&
          `Between ${maxDistanceBetweenWaypoints.points[0].seq} and ${maxDistanceBetweenWaypoints.points[1].seq}`
        }
        units="m"
      />
      <StatisticItem label="Max altitude" value={maxAltitude} units="m" />
      <StatisticItem
        label="Max slope gradient"
        value={maxSlopeGradient.maxGradient}
        tooltip={
          maxSlopeGradient.points &&
          `Between ${maxSlopeGradient.points[0]?.seq} and ${maxSlopeGradient.points[1]?.seq}`
        }
        units="%"
      />
      <StatisticItem
        label="Max telem distance"
        value={maxTelemDistance.maxDistance}
        tooltip={
          maxTelemDistance.point && `At waypoint ${maxTelemDistance.point.seq}`
        }
        units="m"
      />
    </>
  )
}
