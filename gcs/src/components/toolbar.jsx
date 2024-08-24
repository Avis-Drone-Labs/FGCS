/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/

import { Button, Menu, Text } from "@mantine/core"

export default function Toolbar() {
  return (
    <div className="flex flex-row content-center bg-falcongrey-100 p-1 px-2 h-max gap-x-2" id="toolbar">
      {/* FGCS */}
      <Menu position="bottom-start">
        <Menu.Target>
          <Text size="xs" className="no-drag cursor-pointer">FGCS</Text>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item>
            Settings
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* View */}
      <Menu position="bottom-start">
        <Menu.Target>
          <Text size="xs" className="no-drag cursor-pointer">View</Text>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item>
            Reload
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}