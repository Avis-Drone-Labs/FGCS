import { useMemo } from "react"
import { useSelector } from "react-redux"
import {
  EKF_STATUS_DANGER_LEVEL,
  EKF_STATUS_WARNING_LEVEL,
} from "../../../helpers/mavlinkConstants"
import { selectEkfCalculatedStatus } from "../../../redux/slices/droneInfoSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const RED = tailwindColors.red[500]
const YELLOW = tailwindColors.yellow[500]

export default function EkfDisplay({ telemetryFontSize }) {
  const ekfCalculatedStatus = useSelector(selectEkfCalculatedStatus)

  const textColour = useMemo(() => {
    if (ekfCalculatedStatus > EKF_STATUS_DANGER_LEVEL) return RED
    if (ekfCalculatedStatus > EKF_STATUS_WARNING_LEVEL) return YELLOW
    return ""
  }, [ekfCalculatedStatus])

  return (
    <div
      className="font-bold hover:cursor-pointer"
      style={{
        fontSize: `${telemetryFontSize * 1.5}rem`,
        lineHeight: `${telemetryFontSize * 1.75}rem`,
        color: textColour,
      }}
      onClick={() => {
        window.ipcRenderer.invoke("app:open-ekf-status-window")
      }}
    >
      EKF
    </div>
  )
}
