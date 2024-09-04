/*
  File menu button and dropdown, this is for the toolbar.
*/

import { Button } from '@headlessui/react'
import { useState, useRef } from 'react';
import { useOutsideAlerter } from '../../../helpers/outsideAlerter';

export default function FileMenu(props) {
  const [dropdownVisibility, setDropdownVisibility] = useState(false);
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, () => {setDropdownVisibility(false); props.setMenusActive(false)})

  return (
    <div 
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
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    </div>
  )
}