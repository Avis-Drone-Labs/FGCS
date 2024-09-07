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

      <div className={props.menuDropdownClasses} style={{display: dropdownVisibility ? 'block' : 'none'}}>
        <MenuItem name="About FGCS" />
        <Divider/>
        <MenuItem name="Report a Bug" />
        <Divider/>
        <MenuItem name="Exit" />
      </div>
    </div>
  )
}