/*
  The command handler that takes in exposed commands to be called by from
  the spotlight
*/

// 3rd Party Imports
import { useNavigate } from "react-router";

let commands = []

export function Commands() {
  let navigate = useNavigate();
  
  commands = [
    {
      id: "goto_dashboard",
      command: () => {navigate("/")},
      shortcut: ["alt", "1"]
    },
    {
      id: "goto_graphs",
      command: () => {navigate("/graphs")},
      shortcut: ["alt", "2"]
    },
    {
      id: "goto_params",
      command: () => {navigate("/params")},
      shortcut: ["alt", "3"]
    },
    {
      id: "goto_config",
      command: () => {navigate("/config")},
      shortcut: ["alt", "4"]
    },
    {
      id: "goto_fla",
      command: () => {navigate("/fla")},
      shortcut: ["alt", "5"]
    },
  ]
}

export function AddCommand(id, command) {
  // Used to expose a command
  commands.append({id: id, command: command})
}

export function RunCommand(id) {
  // Search for a command by id
  console.log(commands)
  try {
    commands.find((entry) => entry.id == id).command()
  } catch {
    console.log(`Couldn't find command, ${id}, to run`)
  }
}

export function SearchAndRunHotkey(buttonsPressed) {
  // Search for a command via hotkey
  todo()
}