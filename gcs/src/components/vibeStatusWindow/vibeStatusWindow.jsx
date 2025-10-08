/*
  A custom component for displaying vibration status and clipping information in a dedicated window.
*/

"use client"

import { Progress } from "@mantine/core"
import { useEffect, useState } from "react"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import {
  VIBE_STATUS_DANGER_LEVEL,
  VIBE_STATUS_WARNING_LEVEL,
} from "../../helpers/mavlinkConstants"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const VIBE_STRINGS = {
  vibration_x: "X",
  vibration_y: "Y",
  vibration_z: "Z",
}

const CLIPPING_STRINGS = {
  clipping_0: "Primary",
  clipping_1: "Secondary",
  clipping_2: "Tertiary",
}

const RED = tailwindColors.red[500]
const YELLOW = tailwindColors.yellow[500]

function getPercentageFromValue(value) {
  if (value > 100) return 100
  return value.toFixed(2)
}

function getColourFromValue(value) {
  if (value > VIBE_STATUS_DANGER_LEVEL) return RED
  if (value > VIBE_STATUS_WARNING_LEVEL) return YELLOW
  return ""
}

export default function VibeStatusWindow() {
  const [vibrationData, setVibrationData] = useState({
    vibration_x: 0,
    vibration_y: 0,
    vibration_z: 0,
  })
  const [clippingData, setClippingData] = useState({
    clipping_0: 0,
    clipping_1: 0,
    clipping_2: 0,
  })

  useEffect(() => {
    window.ipcRenderer.on("app:send-vibe-status", (_event, status) => {
      setVibrationData({
        vibration_x: status.vibration_x,
        vibration_y: status.vibration_y,
        vibration_z: status.vibration_z,
      })
      setClippingData({
        clipping_0: status.clipping_0,
        clipping_1: status.clipping_1,
        clipping_2: status.clipping_2,
      })
    })
  }, [])

  return (
    <div className="w-full h-full bg-falcongrey-800 flex flex-row items-center justify-center p-4 gap-16">
      <div className="flex flex-col gap-2">
        {Object.entries(vibrationData).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <p>
              {VIBE_STRINGS[key]} - {value.toFixed(2)}
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
      <div className="my-auto flex flex-col gap-2">
        {Object.entries(clippingData).map(([key, value]) => (
          <p key={key} className="text-lg">
            {CLIPPING_STRINGS[key]}: {value}
          </p>
        ))}
      </div>
    </div>
  )
}
