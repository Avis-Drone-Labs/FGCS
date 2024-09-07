/*
  File menu button and dropdown, this is for the toolbar.
*/

// Third Party Imports
import { Button } from '@headlessui/react'
import { useState, useRef } from 'react';
import { useOutsideAlerter } from '../../../helpers/outsideAlerter';

// Local Imports
import Divider from './divider';
import MenuItem from './menuItem';

export default function FileMenu(props) {
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
        File
      </Button>

      <div className={props.menuDropdownClasses} style={{display: dropdownVisibility ? 'block' : 'none'}} onClick={() => {if (!props.areMenusActive) {setDropdownVisibility(false); props.setMenusActive(false)}}}>
        <MenuItem name="About FGCS" link={true} href="https://github.com/avis-drone-labs/fgcs" />
        <Divider />
        <MenuItem name="Report a Bug" link={true} href="https://github.com/Avis-Drone-Labs/FGCS/issues/new/choose" />
        <Divider />
        <MenuItem name="Minimise" shortcut="Alt + Esc" callback={() => window.ipcRenderer.send("minimise")} />
        <MenuItem name="Toggle Maximise" shortcut="Win + Down, Win + Up" callback={() => window.ipcRenderer.send("maximise")} />
        <MenuItem name="Exit" shortcut="Alt + F4" callback={() => window.ipcRenderer.send("close")} />
      </div>
    </div>
  )
}