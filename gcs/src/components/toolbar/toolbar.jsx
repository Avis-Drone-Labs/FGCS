/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/

// Native Imports
import { useEffect, useState } from "react"

// Custom Imports
import { MaximizeIcon, MinimizeIcon, CloseIcon } from "./icons.jsx"
import FileMenu from "./menus/file.jsx"
import ViewMenu from "./menus/view.jsx"
import SpotlightComponent from "../spotlight/spotlight.jsx"

export default function Toolbar() {
  const [areMenusActive, setMenusActive] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    window.ipcRenderer.invoke("isMac").then((result) => {
      setIsMac(result)
    })
  }, [])

  return (
    <>
      <div
        className={`flex flex-row items-center justify-between bg-falcongrey-800 h-10 allow-drag ${isMac && "flex-row-reverse pr-2"}`}
      >
        {/* Logo and Menu Items */}
        <div className="pl-4 flex flex-row items-center h-full no-drag text-sm">
          {/* Icon */}
          <img
            src="titlebar_logo.svg"
            className="w-auto h-2 pr-2 object-contain allow-drag"
          />

          {/* Menu Links */}
          {!isMac && (
            <>
              <div>
                <FileMenu
                  areMenusActive={areMenusActive}
                  setMenusActive={setMenusActive}
                />
              </div>
              <div>
                <ViewMenu
                  areMenusActive={areMenusActive}
                  setMenusActive={setMenusActive}
                />
              </div>
            </>
          )}
        </div>

        {/* Spotlight */}
        <div className="flex justify-center min-w-64 w-1/3 max-w-96 no-drag py-8">
          <SpotlightComponent />
        </div>
        {isMac && <div className="w-1"></div>}
        
        {/* Window actions (close, minimise, maximise) */}
        {!isMac && (
          <div className="flex flex-row items-center h-full">
            {/* Minimise */}
            <div
              title="Minimise"
              className="px-3 flex items-center h-full no-drag cursor-pointer hover:bg-falcongrey-700"
              onClick={() => {
                window.ipcRenderer.send("minimise", [])
              }}
              label="Minimise"
            >
              <MinimizeIcon className="stroke-slate-400" />
            </div>

            {/* Maximise */}
            <div
              title="Maximise"
              className="px-3 flex items-center h-full no-drag cursor-pointer hover:bg-falcongrey-700"
              onClick={() => {
                window.ipcRenderer.send("maximise", [])
              }}
              label="Maximise"
            >
              <MaximizeIcon className="stroke-slate-400" />
            </div>

            {/* Close */}
            <div
              title="Close"
              className="px-3 flex items-center h-full no-drag cursor-pointer group hover:bg-red-500"
              onClick={() => {
                window.ipcRenderer.send("close", [])
              }}
              label="Close"
            >
              <CloseIcon className="stroke-slate-400 group-hover:stroke-white" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
