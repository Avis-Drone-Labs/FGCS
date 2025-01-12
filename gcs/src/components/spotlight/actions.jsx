/*
  A list of actions for the spotlight popup
*/

// Local imports
import kbdBadge, { descriptionBadge } from "./badges"
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
    onClick: () => {RunCommand("goto_dashboard")},
    rightSection: kbdBadge("Alt + 1", badgeColor),
  },
  {
    id: "graphs",
    label: "Graphs",
    type: "page",
    onClick: () => {RunCommand("goto_graphs")},
    rightSection: kbdBadge("Alt + 2", badgeColor),
  },
  {
    id: "params",
    label: "Params",
    type: "page",
    onClick: () => {RunCommand("goto_params")},
    rightSection: kbdBadge("Alt + 3", badgeColor),
  },
  {
    id: "config",
    label: "Config",
    type: "page",
    onClick: () => {RunCommand("goto_config")},
    rightSection: kbdBadge("Alt + 4", badgeColor),
  },
  {
    id: "fla",
    label: "FLA",
    type: "page",
    onClick: () => {RunCommand("goto_fla")},
    rightSection: kbdBadge("Alt + 5", badgeColor),
  },

  // Commands
  {
    id: "refresh",
    label: "Force refresh page",
    type: "command",
    rightSection: kbdBadge("Ctrl + Shift + R", badgeColor),
  },
  {
    id: "open_fla_file",
    label: "Open log file",
    type: "command",
    rightSection: descriptionBadge("FLA"),
  },
]
