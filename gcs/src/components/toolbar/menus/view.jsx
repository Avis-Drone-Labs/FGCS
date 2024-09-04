import { Button } from '@headlessui/react'

export default function ViewMenu(props) {
  return (
    <div>
      <Button className={props.menuLinkClasses}>View</Button>
      <div className={props.menuDropdownClasses} hidden>
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    </div>
  )
}