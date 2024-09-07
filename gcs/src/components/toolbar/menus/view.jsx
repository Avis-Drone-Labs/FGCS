/*
  View menu button and dropdown, this is for the toolbar.
*/

// Third Party Imports
import { Button } from '@headlessui/react'
import { useState, useRef } from 'react';
import { useOutsideAlerter } from '../../../helpers/outsideAlerter';

// Local Imports
import Divider from './divider';
import MenuItem from './menuItem';

export default function ViewMenu(props) {
  const [dropdownVisibility, setDropdownVisibility] = useState(false);
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, () => {setDropdownVisibility(false); props.setMenusActive(false)})

  return (
    <div 
      className="group"
      ref={wrapperRef} 
      onMouseLeave={() => {if (props.areMenusActive) {setDropdownVisibility(false)}}}
      onMouseEnter={() => {if (props.areMenusActive) {setDropdownVisibility(true)}}}
    >
      <Button 
        className={props.menuLinkClasses} 
        onClick={() => {if (!props.areMenusActive) {setDropdownVisibility(true); props.setMenusActive(true)}}}
      >
        View
      </Button>

      <div className={props.menuDropdownClasses} style={{display: dropdownVisibility ? 'block' : 'none'}} onClick={() => {if (!props.areMenusActive) {setDropdownVisibility(false); props.setMenusActive(false)}}}>
        <MenuItem name="Reload" shortcut="Ctrl + R" callback={() => window.ipcRenderer.send("reload")} />
        <MenuItem name="Force Reload" shortcut="Ctrl + Shift + R" callback={() => window.ipcRenderer.send("force_reload")} />
        <MenuItem name="Toggle Developer Tools" shortcut="Ctrl + Shift + I" callback={() => window.ipcRenderer.send("toggle_developer_tools")} />

        <Divider />
        <MenuItem name="Actual Size" shortcut="Ctrl + 0" callback={() => window.ipcRenderer.send("actual_size")} />
        <MenuItem name="Zoom In" shortcut="Ctrl + Shift + +" callback={() => window.ipcRenderer.send("zoom_in")} />
        <MenuItem name="Zoom Out" shortcut="Ctrl + -" callback={() => window.ipcRenderer.send("zoom_out")} />

        <Divider />
        <MenuItem name="Toggle Full Screen" shortcut="F11" callback={() => window.ipcRenderer.send("toggle_fullscreen")} />
      </div>
    </div>
  )
}