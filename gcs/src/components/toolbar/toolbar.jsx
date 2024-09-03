/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/

// Third Party Imports
import { Menu, Text } from "@mantine/core"

// Custom Images
import { MaximizeIcon, MinimizeIcon, CloseIcon } from "./icons.jsx";

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Toolbar() {
  return (
    <>
      <div className="flex flex-row items-center justify-between bg-falcongrey-100 h-8" id="toolbar">
        {/* Logo and Menu Items */}
        <div className="pl-4 flex flex-row items-center h-full gap-x-2">
          {/* Icon */}
          <img src="titlebar_logo.svg" className="w-auto h-2 object-contain no-drag" />

          {/* FGCS */}
          <Menu 
            position="bottom-start"
            styles={{
              dropdown: {
                borderRadius: "0px"
              }
            }}
          >
            <Menu.Target>
              <Text size="xs" className="no-drag cursor-pointer">File</Text>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item>
                About FGCS
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item>
                Report a Bug
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item>
                Exit
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* View */}
          <Menu position="bottom-start">
            <Menu.Target>
              <Text size="xs" className="no-drag cursor-pointer">Edit</Text>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item>
                Reload
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>

        {/* Window actions (close, minimise, maximise) */}
        <div className="flex flex-row items-center h-full">
          {/* Minimise */}
          <div title="Minimise" className="px-3 flex items-center h-full no-drag cursor-pointer hover:bg-falcongrey-80" onClick={() => {ipcRenderer.send('minimise', [])}} label="Minimise">
            <MinimizeIcon className="stroke-slate-400" />
          </div>

          {/* Maximise */}
          <div title="Maximise" className="px-3 flex items-center h-full no-drag cursor-pointer hover:bg-falcongrey-80" onClick={() => {ipcRenderer.send('maximise', [])}} label="Maximise">
            <MaximizeIcon className="stroke-slate-400" />
          </div>

          {/* Close */}
          <div title="Close" className="px-3 flex items-center h-full no-drag cursor-pointer group hover:bg-red-500" onClick={() => {ipcRenderer.send('close', [])}} label="Close">
            <CloseIcon className="stroke-slate-400 group-hover:stroke-white" />
          </div>
        </div>
      </div>
    </>
  )
}