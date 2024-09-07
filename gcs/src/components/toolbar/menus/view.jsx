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

      <div className={props.menuDropdownClasses} style={{display: dropdownVisibility ? 'block' : 'none'}}>
        <MenuItem name="Reload" shortcut="Ctrl + R"/>
        <MenuItem name="Force Reload" shortcut="Ctrl + Shift + R"/>
        <MenuItem name="Toggle Developer Tools" shortcut="Ctrl + Shift + I"/>

        <Divider/>
        <MenuItem name="Actual Size" shortcut="Ctrl + 0"/>
        <MenuItem name="Zoom In" shortcut="Ctrl + +"/>
        <MenuItem name="Zoom Out" shortcut="Ctrl + -"/>

        <Divider/>
        <MenuItem name="Toggle Full Screen" shortcut="F11"/>
      </div>
    </div>
  )
}