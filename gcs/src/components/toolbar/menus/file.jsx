/*
  File menu button and dropdown, this is for the toolbar.
*/

// Local Imports
import Divider from "./divider"
import MenuItem from "./menuItem"
import MenuTemplate from "./menuTemplate"
import packageJson from "../../../../package.json"
import { useSettings } from "../../../helpers/settings"

export default function FileMenu(props) {
  const { open } = useSettings()

  return (
    <MenuTemplate
      title="File"
      areMenusActive={props.areMenusActive}
      setMenusActive={props.setMenusActive}
    >
      <MenuItem
        name="About IMACS"
        link={true}
        href="https://github.com/UWARG/IMACS-3.0"
      />
      <MenuItem name="Current Version" shortcut={packageJson.version} />
      <Divider />
      <MenuItem
        name="Report a Bug"
        link={true}
        href="https://github.com/Avis-Drone-Labs/FGCS/issues/new/choose"
      />
      <Divider />
      <MenuItem
        name="Minimise"
        shortcut="Alt + Esc"
        callback={() => window.ipcRenderer.send("minimise")}
      />
      <MenuItem
        name="Toggle Maximise"
        shortcut="Win + Down, Win + Up"
        callback={() => window.ipcRenderer.send("maximise")}
      />
      <MenuItem
        name="Exit"
        shortcut="Alt + F4"
        callback={() => window.ipcRenderer.send("close")}
      />
      <Divider />
      <MenuItem name="Settings" callback={() => open()} />
    </MenuTemplate>
  )
}
