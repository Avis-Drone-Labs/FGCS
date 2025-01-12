/*
  A list of actions for the spotlight popup
*/

// Local imports
import kbdBadge, { descriptionBadge } from "./badges"

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
    onClick: () => console.log("Dashboard spotlight button clicked!"),
    rightSection: kbdBadge("Alt + 1", badgeColor),
  },
  {
    id: "graphs",
    label: "Graphs",
    type: "page",
    onClick: () => console.log("Graphs spotlight button clicked!"),
    rightSection: kbdBadge("Alt + 2", badgeColor),
  },
  {
    id: "params",
    label: "Params",
    type: "page",
    onClick: () => console.log("Params spotlight button clicked!"),
    rightSection: kbdBadge("Alt + 3", badgeColor),
  },
  {
    id: "config",
    label: "Config",
    type: "page",
    onClick: () => console.log("Config spotlight button clicked!"),
    rightSection: kbdBadge("Alt + 4", badgeColor),
  },
  {
    id: "fla",
    label: "FLA",
    type: "page",
    onClick: () => console.log("FLA spotlight button clicked!"),
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

// export const spotlightActions = [
//   {
//     group: "Pages",
//     actions: [
//       {
//         id: 'dashboard',
//         label: 'Dashboard',
//         onClick: () => console.log('Dashboard spotlight button clicked!'),
//       },
//       {
//         id: 'graphs',
//         label: 'Graphs',
//         onClick: () => console.log('Graphs spotlight button clicked!'),
//       },
//       {
//         id: 'params',
//         label: 'Params',
//         onClick: () => console.log('Params spotlight button clicked!'),
//       },
//       {
//         id: 'config',
//         label: 'Config',
//         onClick: () => console.log('Config spotlight button clicked!'),
//       },
//       {
//         id: 'fla',
//         label: 'FLA',
//         onClick: () => console.log('FLA spotlight button clicked!'),
//       },
//     ]
//   },
//   {
//     group: "Actions",
//     actions: [
//       {id: "refresh", label: "Force refresh page", rightSection: kbdBadge("Ctrl + Shift + R", badgeColor)}
//     ]
//   }
// ];
