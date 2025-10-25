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
        callback={() => window.ipcRenderer.send("window:reload")}
      />
      <MenuItem
        name="Force Reload"
        shortcut="Ctrl + Shift + R"
        callback={() => window.ipcRenderer.send("window:force-reload")}
      />
      <MenuItem
        name="Toggle Developer Tools"
        shortcut="Ctrl + Shift + I"
        callback={() =>
          window.ipcRenderer.send("window:toggle-developer-tools")
        }
      />

      <Divider />

      <MenuItem
        name="Actual Size"
        shortcut="Ctrl + 0"
        callback={() => window.ipcRenderer.send("window:actual-size")}
      />
      <MenuItem
        name="Zoom In"
        shortcut="Ctrl + Shift + +"
        callback={() => window.ipcRenderer.send("window:zoom-in")}
      />
      <MenuItem
        name="Zoom Out"
        shortcut="Ctrl + -"
        callback={() => window.ipcRenderer.send("window:zoom-out")}
      />

      <Divider />

      <MenuItem
        name="Toggle Full Screen"
        shortcut="F11"
        callback={() => window.ipcRenderer.send("window:toggle-fullscreen")}
      />
    </MenuTemplate>
  )
}
