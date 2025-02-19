/*
  View menu button and dropdown, this is for the toolbar.
*/

// Local Imports
import Divider from "./divider"
import MenuItem from "./menuItem"
import MenuTemplate from "./menuTemplate"

export default function ViewMenu(props) {
  return (
    <MenuTemplate
      title="View"
      areMenusActive={props.areMenusActive}
      setMenusActive={props.setMenusActive}
    >
      <MenuItem
        name="Reload"
        shortcut="Ctrl + R"
        callback={() => window.ipcRenderer.send("reload")}
      />
      <MenuItem
        name="Force Reload"
        shortcut="Ctrl + Shift + R"
        callback={() => window.ipcRenderer.send("force_reload")}
      />
      <MenuItem
        name="Toggle Developer Tools"
        shortcut="Ctrl + Shift + I"
        callback={() => window.ipcRenderer.send("toggle_developer_tools")}
      />

      <Divider />
      <MenuItem
        name="Actual Size"
        shortcut="Ctrl + 0"
        callback={() => window.ipcRenderer.send("actual_size")}
      />
      <MenuItem
        name="Zoom In"
        shortcut="Ctrl + Shift + +"
        callback={() => window.ipcRenderer.send("zoom_in")}
      />
      <MenuItem
        name="Zoom Out"
        shortcut="Ctrl + -"
        callback={() => window.ipcRenderer.send("zoom_out")}
      />

      <Divider />
      <MenuItem
        name="Toggle Full Screen"
        shortcut="F11"
        callback={() => window.ipcRenderer.send("toggle_fullscreen")}
      />
    </MenuTemplate>
  )
}
