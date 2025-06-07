/*
  Custom component for map
  In the top right of the map
*/

// Base imports
import moment from "moment"
import { cloneElement, useEffect, useState } from "react"

// Third party imports
import { Tooltip } from "@mantine/core"
import { useInterval } from "@mantine/hooks"
import { IconClock, IconNetwork, IconNetworkOff } from "@tabler/icons-react"

// Helper imports
import { socket } from "../../helpers/socket"
import GetOutsideVisibilityColor from "../../helpers/outsideVisibility"
import AlertSection from "./alert"

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

  // Start clock
  useEffect(() => {
    updateClock.start()
    return updateClock.stop
  }, [])

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
