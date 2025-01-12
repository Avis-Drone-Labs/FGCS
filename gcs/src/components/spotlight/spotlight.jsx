/*
  The spotlight component, a way of searching and navigating through FGCS via keyboard
*/

// 3rd Party Imports
import { Button, Badge  } from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function SpotlightComponent() {
  const textColorStyle = {
    root: {
      color: "var(--mantine-text-color)"
    }
  }

  function kbdBadge(mac) {
    let text = (mac ? "Cmd" : "Ctrl") + " + K"

    return (
      <Badge 
        color={tailwindColors.falcongrey[700]} 
        radius="sm" 
        styles={textColorStyle}
      >
        {text}
      </Badge >
    )
  }

  return (
    <Button 
      radius="xs"
      color={tailwindColors.falcongrey[800]}
      rightSection={kbdBadge(false)}
      fullWidth
      justify="space-between"
      styles={textColorStyle}
    >
      <IconSearch size={14} className="mr-4"/> Search
    </Button>
  )
}