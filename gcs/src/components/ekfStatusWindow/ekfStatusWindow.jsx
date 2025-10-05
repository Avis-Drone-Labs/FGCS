"use client"

import { Progress } from "@mantine/core"
import { useEffect, useMemo, useState } from "react"
import {
  EKF_STATUS_FLAGS,
  getActiveEKFFlags,
} from "../../helpers/mavlinkConstants"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// EKF Flags that are good when enabled
const FLAGS_ENABLED_BAD = ["EKF_UNITIALIZED", "EKF_GPS_GLITCHING"]

const EKF_VARIANCE_STRINGS = {
  compass_variance: "Compass Variance",
  pos_horiz_variance: "Horizontal Pos Variance",
  pos_vert_variance: "Vertical Pos Variance",
  terrain_alt_variance: "Terrain Alt Variance",
  velocity_variance: "Velocity Variance",
}

const RED = tailwindColors.red[500]
const YELLOW = tailwindColors.yellow[500]
const GREEN = tailwindColors.green[500]

function getPercentageFromValue(value) {
  return (value * 100).toFixed(2)
}

function getColourFromValue(value) {
  if (value > 0.8) return RED
  if (value > 0.5) return YELLOW
  return ""
}

export default function EkfStatusWindow() {
  const [ekfVariances, setEkfVariances] = useState({
    compass_variance: 0,
    pos_horiz_variance: 0,
    pos_vert_variance: 0,
    terrain_alt_variance: 0,
    velocity_variance: 0,
  })
  const [ekfFlags, setEkfFlags] = useState(0)

  const activeFlags = useMemo(() => {
    return getActiveEKFFlags(ekfFlags)
  }, [ekfFlags])

  useEffect(() => {
    window.ipcRenderer.on("app:send-ekf-status", (_event, status) => {
      console.log(status)
      setEkfVariances({
        compass_variance: status.compass_variance,
        pos_horiz_variance: status.pos_horiz_variance,
        pos_vert_variance: status.pos_vert_variance,
        terrain_alt_variance: status.terrain_alt_variance,
        velocity_variance: status.velocity_variance,
      })
      setEkfFlags(status.flags)
    })
  }, [])

  return (
    <div className="w-full h-full bg-falcongrey-800 flex flex-row items-center justify-center p-4 gap-20">
      <div className="flex flex-col gap-2">
        {Object.entries(ekfVariances).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <p>
              {EKF_VARIANCE_STRINGS[key]} - {value.toFixed(2)}
            </p>
            <Progress.Root className="!h-6 w-80">
              <Progress.Section
                value={getPercentageFromValue(value)}
                style={{
                  backgroundColor: getColourFromValue(value),
                }}
              ></Progress.Section>
            </Progress.Root>
          </div>
        ))}
      </div>
      <div className="my-auto">
        {Object.values(EKF_STATUS_FLAGS).map((flag) => (
          <p
            key={flag}
            style={{
              color: activeFlags.includes(flag)
                ? FLAGS_ENABLED_BAD.includes(flag)
                  ? RED
                  : GREEN
                : "",
            }}
          >
            {flag}
          </p>
        ))}
      </div>
    </div>
  )
}
