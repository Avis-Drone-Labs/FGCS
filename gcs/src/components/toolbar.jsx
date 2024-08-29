/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/

// Third Party Imports
import { Menu, Text, Image } from "@mantine/core"
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react";

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

const { ipcRenderer } = window.require('electron');
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Toolbar() {
  return (
    <div className="flex flex-row content-center justify-between bg-falcongrey-100 p-1 px-2 h-max gap-x-2" id="toolbar">
      {/* Logo and Menu Items */}
      <div className="flex flex-row items-center h-max gap-x-2">
        {/* Icon */}
        <img src="app_icon.ico" className="w-auto h-5 object-contain no-drag" />

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

      {/* Window actions (close, minimise, maximise) */}
      <div className="flex flex-row items-center h-max gap-x-2">
        <div className="no-drag cursor-pointer" onClick={() => {ipcRenderer.send('minimise', [])}}><IconChevronDown className="h-[80%]" color={tailwindColors["falconred"][100]} /></div>
        <div className="no-drag cursor-pointer" onClick={() => {ipcRenderer.send('maximise', [])}}><IconChevronUp className="h-[80%]" color={tailwindColors["falconred"][100]} /></div>
        <div className="no-drag cursor-pointer" onClick={() => {ipcRenderer.send('close', [])}}><IconX className="h-[80%]" color={tailwindColors["falconred"][100]} /></div>
      </div>
    </div>
  )
}