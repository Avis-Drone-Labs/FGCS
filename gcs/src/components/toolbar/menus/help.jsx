import { Button } from '@headlessui/react'

export default function HelpMenu(props) {
  return (
    <div>
      <Button className={props.menuLinkClasses}>Help</Button>
      <div className={props.menuDropdownClasses}>
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    </div>
  )
}