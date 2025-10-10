/*
A component that displays "VIBE" text, which changes color based on vibration data, on the dashboard.
*/

import { useMemo } from "react"
import { useSelector } from "react-redux"
import { selectVibrationData } from "../../redux/slices/droneInfoSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
import {
  VIBE_STATUS_DANGER_LEVEL,
  VIBE_STATUS_WARNING_LEVEL,
} from "../../helpers/mavlinkConstants"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const RED = tailwindColors.red[500]
const YELLOW = tailwindColors.yellow[500]

export default function VibeDisplay({ telemetryFontSize }) {
  const vibrationData = useSelector(selectVibrationData)

  const textColour = useMemo(() => {
    const vibes = [
      vibrationData.vibration_x,
      vibrationData.vibration_y,
      vibrationData.vibration_z,
    ]

    if (vibes.some((v) => v > VIBE_STATUS_DANGER_LEVEL)) return RED
    if (vibes.some((v) => v > VIBE_STATUS_WARNING_LEVEL)) return YELLOW
    return ""
  }, [vibrationData])

  return (
    <div
      className="font-bold hover:cursor-pointer"
      style={{
        fontSize: `${telemetryFontSize * 1.25}rem`,
        lineHeight: `${telemetryFontSize * 1.75}rem`,
        color: textColour,
      }}
      onClick={() => {
        window.ipcRenderer.invoke("app:open-vibe-status-window")
      }}
    >
      VIBE
    </div>
  )
}
