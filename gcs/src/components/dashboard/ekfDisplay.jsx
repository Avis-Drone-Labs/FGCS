import { useMemo } from "react"
import { useSelector } from "react-redux"
import { selectEkfCalculatedStatus } from "../../redux/slices/droneInfoSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const RED = tailwindColors.red[500]
const YELLOW = tailwindColors.yellow[500]

export default function EkfDisplay({ telemetryFontSize }) {
  const ekfCalculatedStatus = useSelector(selectEkfCalculatedStatus)

  const textColour = useMemo(() => {
    if (ekfCalculatedStatus > 0.8) return RED
    if (ekfCalculatedStatus > 0.5) return YELLOW
    return ""
  }, [ekfCalculatedStatus])

  return (
    <div
      className="font-bold hover:cursor-pointer"
      style={{
        fontSize: `${telemetryFontSize * 1.25}rem`,
        lineHeight: `${telemetryFontSize * 1.75}rem`,
        color: textColour,
      }}
    >
      EKF
    </div>
  )
}
