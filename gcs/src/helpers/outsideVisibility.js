/*
  outsideVisibility. Used to get the colour from one central place
*/

// 3rd Party Imports
import { useLocalStorage } from '@mantine/hooks'

// Tailwind styling
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function GetOutsideVisibilityColor() {
  const [outsideVisibility] = useLocalStorage({
    key: 'outsideVisibility',
    defaultValue: false,
  })

  return getOutsideVisibilityColorManually(outsideVisibility)
}

export function getOutsideVisibilityColorManually(isOutside) {
  return isOutside
    ? tailwindColors.falcongrey['900']
    : tailwindColors.falcongrey['TRANSLUCENT']
}
