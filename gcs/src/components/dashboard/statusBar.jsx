/*
  Custom component for map
  In the top right of the map
*/

// Base imports
import moment from "moment"
import { cloneElement, useEffect, useRef, useState } from "react"

// Third party imports
import { Tooltip } from "@mantine/core"
import { useInterval } from "@mantine/hooks"
import { IconClock, IconNetwork, IconNetworkOff } from "@tabler/icons-react"

// Redux
import { useSelector } from "react-redux"
import { selectTelemetry } from "../../redux/slices/droneInfoSlice"

// Helper imports
import { socket } from "../../helpers/socket"
import GetOutsideVisibilityColor from "../../helpers/outsideVisibility"
import AlertSection, { AlertCategory, AlertSeverity } from "./alert"
import { useSettings } from "../../helpers/settings"

import { useAlerts } from "./alertProvider"

export function StatusSection({ icon, value, tooltip }) {
  return (
    <Tooltip label={tooltip}>
      <div className="flex flex-row items-center justify-center space-x-1">
        {cloneElement(icon, { size: 20 })}
        {value !== null && <p>{value}</p>}
      </div>
    </Tooltip>
  )
}

export default function StatusBar(props) {
  const [time, setTime] = useState(moment())
  const updateClock = useInterval(() => setTime(moment()), 1000)
  const telemetryData = useSelector(selectTelemetry)

  // Start clock
  useEffect(() => {
    updateClock.start()
    return updateClock.stop
  }, [])

  // Alerts
  const { getSetting } = useSettings()
  const { dispatchAlert, dismissAlert } = useAlerts()
  const highestAltitudeRef = useRef(0)

  useEffect(() => {
    const maxAltitude = getSetting("Dashboard.maxAltitudeAlert")
    if (telemetryData.alt > maxAltitude) {
      dispatchAlert({
        category: AlertCategory.Altitude,
        severity: AlertSeverity.Red,
        jsx: <>Caution! You've exceeded {maxAltitude}m</>,
      })
      return
    } else {
      dismissAlert(AlertCategory.Altitude)
    }

    if (telemetryData.alt > highestAltitudeRef.current) {
      highestAltitudeRef.current = telemetryData.alt
      return
    }

    const minAltitudes = (getSetting("Dashboard.minAltitudeAlerts") ?? []).slice()
    minAltitudes.sort((a1, a2) => a1 - a2)

    for (const [i, altitude] of minAltitudes.entries()) {
      if (highestAltitudeRef.current > altitude && telemetryData.alt < altitude) {
        dispatchAlert({
          category: AlertCategory.Altitude,
          severity:
            i == 0
              ? AlertSeverity.Red
              : i == minAltitudes.length - 1
                ? AlertSeverity.Yellow
                : AlertSeverity.Orange,
          jsx: <>Caution! You've fallen below {altitude}m</>,
        })
        return
      }
    }

    dismissAlert(AlertCategory.Altitude)
  }, [telemetryData.alt]);

  return (
    <div className={`${props.className} flex flex-col items-end`}>
      <div
        className="flex flex-row space-x-3 p-1"
        style={{ backgroundColor: GetOutsideVisibilityColor() }}
      >
        {props.children}
        <StatusSection
          icon={socket.connected ? <IconNetwork /> : <IconNetworkOff />}
          value=""
          tooltip={
            socket.connected
              ? "Connected to socket"
              : "Disconnected from socket"
          }
        />
        <StatusSection
          icon={<IconClock />}
          value={time?.format("HH:mm:ss")}
          tooltip="Local time"
        />
      </div>
      <div
        className="flex flex-row space-x-3 p-1"
        style={{ backgroundColor: GetOutsideVisibilityColor() }}
      >
        <p className="text-sm text-blue-200">Current heading</p>
        <p className="text-sm text-red-200">Desired heading</p>
      </div>
      <div className="m-2">
        <AlertSection />
      </div>
    </div>
  )
}
