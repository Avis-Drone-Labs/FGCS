/*
  A list of actions for the spotlight popup
*/

// Local imports
import kbdBadge from "./badges"
import { RunCommand } from "./commandHandler"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors
const badgeColor = tailwindColors.falcongrey[600]

export let actions = []
export function AddSpotlightAction(
  id,
  label,
  type,
  command,
  rightSection = null,
) {
  actions.push({
    id: id,
    label: label,
    type: type,
    command: command,
    rightSection: rightSection,
  })
}

// Pages
AddSpotlightAction(
  "dashboard",
  "Dashboard",
  "page",
  () => {
    RunCommand("goto_dashboard")
  },
)
AddSpotlightAction(
  "graphs",
  "Graphs",
  "page",
  () => {
    RunCommand("goto_graphs")
  },
)
AddSpotlightAction(
  "params",
  "Params",
  "page",
  () => {
    RunCommand("goto_params")
  },
)
AddSpotlightAction(
  "config",
  "Config",
  "page",
  () => {
    RunCommand("goto_config")
  },
)
AddSpotlightAction(
  "fla",
  "FLA",
  "page",
  () => {
    RunCommand("goto_fla")
  },
)

// Commands
AddSpotlightAction(
  "force_refresh",
  "Force refresh page",
  "command",
  () => {
    RunCommand("force_refresh")
  },
  kbdBadge("Ctrl + Shift + R", badgeColor),
)
AddSpotlightAction("connect_to_drone", "Connect to drone", "command", () => {
  RunCommand("connect_to_drone")
})
AddSpotlightAction(
  "disconnect_from_drone",
  "Disconnect from drone",
  "command",
  () => {
    RunCommand("disconnect_from_drone")
  },
)
AddSpotlightAction("open_settings", "Open Settings", "command", () => {RunCommand("open_settings")})
