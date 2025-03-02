/*
  Keyboard shortcut badge
*/

// 3rd Party Imports
import { Badge } from "@mantine/core"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export function descriptionBadge(text) {
  return <span className="text-falcongrey-400 text-sm">{text}</span>
}

export default function kbdBadge(
  text,
  color = tailwindColors.falcongrey[700],
  size = "xs",
) {
  return (
    <Badge
      color={color}
      radius="sm"
      size={size}
      classNames={{ root: "!text-[var(--mantine-text-color)]" }}
    >
      {text}
    </Badge>
  )
}
