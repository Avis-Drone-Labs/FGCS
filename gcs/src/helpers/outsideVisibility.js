/*
  outsideVisibility. Used to get the colour from one central place
*/

import { useMemo } from "react"

// Redux
import { useSelector } from "react-redux"
import { selectOutsideVisibility } from "../redux/slices/droneConnectionSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const outsideVisibilityEnabledColor = tailwindColors.falcongrey["900"]
const outsideVisibilityDisabledColor = tailwindColors.falcongrey["TRANSLUCENT"]

export default function GetOutsideVisibilityColor() {
  const outsideVisibility = useSelector(selectOutsideVisibility)

  const color = useMemo(() => {
    return outsideVisibility
      ? outsideVisibilityEnabledColor
      : outsideVisibilityDisabledColor
  }, [outsideVisibility])

  return color
}
