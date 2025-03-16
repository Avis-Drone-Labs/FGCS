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
function AddSpotlightAction(
  id,
  label,
  type,
  command,
  rightSection = null,
  macRightSection = null,
) {
  actions.push({
    id: id,
    label: label,
    type: type,
    command: command,
    rightSection: rightSection,
    macRightSection: macRightSection,
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
  kbdBadge("ALT + 1", badgeColor),
  kbdBadge("⌘ + 1", badgeColor),
)
AddSpotlightAction(
  "missions",
  "Missions",
  "page",
  () => {
    RunCommand("goto_missions")
  },
  kbdBadge("ALT + 2", badgeColor),
  kbdBadge("⌘ + 2", badgeColor),
)
AddSpotlightAction(
  "graphs",
  "Graphs",
  "page",
  () => {
    RunCommand("goto_graphs")
  },
  kbdBadge("ALT + 3", badgeColor),
  kbdBadge("⌘ + 3", badgeColor),
)
AddSpotlightAction(
  "params",
  "Params",
  "page",
  () => {
    RunCommand("goto_params")
  },
  kbdBadge("ALT + 4", badgeColor),
  kbdBadge("⌘ + 4", badgeColor),
)
AddSpotlightAction(
  "config",
  "Config",
  "page",
  () => {
    RunCommand("goto_config")
  },
  kbdBadge("ALT + 5", badgeColor),
  kbdBadge("⌘ + 5", badgeColor),
)
AddSpotlightAction(
  "fla",
  "FLA",
  "page",
  () => {
    RunCommand("goto_fla")
  },
  kbdBadge("ALT + 6", badgeColor),
  kbdBadge("⌘ + 6", badgeColor),
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
  kbdBadge("⌘ + Shift + R", badgeColor),
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
AddSpotlightAction(
  "open_settings",
  "Open Settings",
  "command",
  () => {
    RunCommand("open_settings")
  },
  kbdBadge("Ctrl + ,", badgeColor),
  kbdBadge("⌘ + ,", badgeColor),
)
