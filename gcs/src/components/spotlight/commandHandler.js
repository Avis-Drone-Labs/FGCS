/*
  The command handler that takes in exposed commands to be called by from
  the spotlight
*/

// 3rd Party Imports
import { useNavigate } from "react-router"
import { useSettings } from "../../helpers/settings"
import { useState, useEffect } from "react"
import { useHotkeys } from "@mantine/hooks"

let commands = []

export function Commands() {
  let navigate = useNavigate()
  const [isMac, setIsMac] = useState(false)
  
  useEffect(() => {
    window.ipcRenderer.invoke("isMac").then((result) => {
      setIsMac(result)
    })
  }, [])
  
  commands = []
  const {open, isOpen, close} = useSettings();

  // Define commands
  AddCommand("goto_dashboard", () => { navigate("/") })
  AddCommand("goto_graphs", () => { navigate("/graphs") })
  AddCommand("goto_params", () => { navigate("/params") })
  AddCommand("goto_config", () => { navigate("/config") })
  AddCommand("goto_fla", () => { navigate("/fla") })
  AddCommand("force_refresh", () => { window.ipcRenderer.send("force_reload") })
  AddCommand("open_settings", () => { open() })
  AddCommand("connect_to_drone", () => { /* connect */ })
  AddCommand("disconnect_from_drone", () => { /* disconnect */ })
  
  // Register hotkeys
  useHotkeys([
    [isMac?'meta+1':'alt+1', () => RunCommand("goto_dashboard")],
    [isMac?'meta+2':'alt+2', () => RunCommand("goto_graphs")],
    [isMac?'meta+3':'alt+3', () => RunCommand("goto_params")],
    [isMac?'meta+4':'alt+4', () => RunCommand("goto_config")],
    [isMac?'meta+5':'alt+5', () => RunCommand("goto_fla")],
    ['mod+shift+r', () => RunCommand("force_refresh")], 
    ['mod+,', () => RunCommand("open_settings")],
  ])  
}


export function AddCommand(id, command, shortcut = null, macShortcut = null) {
  // Used to expose a command
  if (commands.find((entry) => entry.id == id) == undefined) {
    commands.push({ 
      id: id, 
      command: command, 
      shortcut: shortcut,
      macShortcut: macShortcut
    })
  }
}

export function RunCommand(id) {
  // Search for a command by id
  console.log(`Running command, ${id}`)
  try {
    commands.find((entry) => entry.id == id).command()
  } catch {
    console.log(`Couldn't find command, ${id}, to run`)
  }
}

// export function SearchAndRunHotkey(buttonsPressed) {
//   // Search for a command via hotkey
// }
function logKeyPress(event) {
  // Get the pressed key
  const key = event.key;
  
  // Check for modifier keys
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.altKey) modifiers.push('Alt');
  if (event.metaKey) modifiers.push('Meta'); // Command key on Mac
  
  // Create a description of the key combination
  let description = '';
  if (modifiers.length > 0) {
    description = modifiers.join('+') + '+' + key;
  } else {
    description = key;
  }
  
  // Log the key press information
  console.log('Key pressed:', description);
  console.log('Key details:', {
    key: key,
    code: event.code,
    modifiers: modifiers,
    event: event
  });
}

// Add the event listener
document.addEventListener('keydown', logKeyPress);