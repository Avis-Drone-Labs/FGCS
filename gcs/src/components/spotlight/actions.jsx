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

export const actions = [
  // Pages
  {
    id: "dashboard",
    label: "Dashboard",
    type: "page",
    command: () => {
      RunCommand("goto_dashboard")
    },
    rightSection: kbdBadge("Alt + 1", badgeColor),
  },
  {
    id: "graphs",
    label: "Graphs",
    type: "page",
    command: () => {
      RunCommand("goto_graphs")
    },
    rightSection: kbdBadge("Alt + 2", badgeColor),
  },
  {
    id: "params",
    label: "Params",
    type: "page",
    command: () => {
      RunCommand("goto_params")
    },
    rightSection: kbdBadge("Alt + 3", badgeColor),
  },
  {
    id: "config",
    label: "Config",
    type: "page",
    command: () => {
      RunCommand("goto_config")
    },
    rightSection: kbdBadge("Alt + 4", badgeColor),
  },
  {
    id: "fla",
    label: "FLA",
    type: "page",
    command: () => {
      RunCommand("goto_fla")
    },
    rightSection: kbdBadge("Alt + 5", badgeColor),
  },

  // Commands
  {
    id: "refresh",
    label: "Force refresh page",
    type: "command",
    command: () => {
      RunCommand("force_refresh")
    },
    rightSection: kbdBadge("Ctrl + Shift + R", badgeColor),
  },
  {
    id: "connect_to_drone",
    label: "Connect to drone",
    type: "command",
    command: () => {
      RunCommand("connect_to_drone")
    },
  },
  {
    id: "disconnect_from_drone",
    label: "Disconnect from drone",
    type: "command",
    command: () => {
      RunCommand("disconnect_from_drone")
    },
  },
]
