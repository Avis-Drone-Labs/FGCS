import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

export default function ViewMenu(props) {
  return (
    <Menu>
      <MenuButton className={props.menuLinkClasses}>View</MenuButton>
      <MenuItems anchor="bottom">
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/settings">
            Setting 1
          </a>
        </MenuItem>
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/support">
            Setting 2
          </a>
        </MenuItem>
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/license">
            Setting 3
          </a>
        </MenuItem>
      </MenuItems>
    </Menu>

  )
}