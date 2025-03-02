/*
  Default menu template to help stop reused code
*/

// Third Party Imports
import { Button } from "@headlessui/react"
import { useState, useRef } from "react"
import { useOutsideAlerter } from "../../../helpers/outsideAlerter"

export default function MenuTemplate({
  children,
  areMenusActive,
  setMenusActive,
  title,
}) {
  const [dropdownVisibility, setDropdownVisibility] = useState(false)
  const wrapperRef = useRef(null)
  useOutsideAlerter(wrapperRef, () => {
    setDropdownVisibility(false)
    setMenusActive(false)
  })

  let menuLinkClasses =
    "outline-none px-2 rounded-md hover:cursor-pointer group-hover:bg-falcongrey-600"
  let menuDropdownClasses =
    "flex flex-col absolute z-50 outline-none px-1 py-1 rounded-md bg-falcongrey-700 "

  return (
    <div
      className="group"
      ref={wrapperRef}
      onMouseLeave={() => {
        if (areMenusActive) {
          setDropdownVisibility(false)
        }
      }}
      onMouseEnter={() => {
        if (areMenusActive) {
          setDropdownVisibility(true)
        }
      }}
    >
      <Button
        className={menuLinkClasses}
        onClick={() => {
          if (!areMenusActive) {
            setDropdownVisibility(true)
            setMenusActive(true)
          }
        }}
      >
        {title}
      </Button>

      <div
        className={menuDropdownClasses}
        style={{ display: dropdownVisibility ? "block" : "none" }}
        onClick={() => {
          if (!areMenusActive) {
            setDropdownVisibility(false)
            setMenusActive(false)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
