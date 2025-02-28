/*
  The command handler that takes in exposed commands to be called by from
  the spotlight
*/

// 3rd Party Imports
import { useNavigate } from "react-router"
import { useSettings } from "../../helpers/settings"

let commands = []

export function Commands() {
  let navigate = useNavigate()
  commands = []

  // Default commands
  AddCommand(
    "goto_dashboard",
    () => {
      navigate("/")
    },
    ["alt", "1"],
  )
  AddCommand(
    "goto_graphs",
    () => {
      navigate("/graphs")
    },
    ["alt", "2"],
  )
  AddCommand(
    "goto_params",
    () => {
      navigate("/params")
    },
    ["alt", "3"],
  )
  AddCommand(
    "goto_config",
    () => {
      navigate("/config")
    },
    ["alt", "4"],
  )
  AddCommand(
    "goto_fla",
    () => {
      navigate("/fla")
    },
    ["alt", "5"],
  )
  AddCommand("force_refresh", () => {
    window.ipcRenderer.send("force_reload")
  })

  // Open settings
  const {open} = useSettings();
  AddCommand("open_settings", () => {open()})
}

export function AddCommand(id, command, shortcut = null) {
  // Used to expose a command
  if (commands.find((entry) => entry.id == id) == undefined) {
    commands.push({ id: id, command: command, shortcut: shortcut })
  }
}

export function RunCommand(id) {
  // Search for a command by id
  console.log("Trying to run command " + id)
  try {
    commands.find((entry) => entry.id == id).command()
  } catch {
    console.log(`Couldn't find command, ${id}, to run`)
  }
}

// export function SearchAndRunHotkey(buttonsPressed) {
//   // Search for a command via hotkey
// }
