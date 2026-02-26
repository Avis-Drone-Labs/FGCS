/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/

// Native Imports
import { useEffect, useState, useRef } from "react"

// Custom Imports
import SpotlightComponent from "../spotlight/spotlight.jsx"
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./icons.jsx"
import AdvancedMenu from "./menus/advanced.jsx"
import FileMenu from "./menus/file.jsx"
import ViewMenu from "./menus/view.jsx"
import GraphsMenu from "./menus/graphs.jsx"
import ConfirmExitModal from "./confirmExitModal.jsx"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice.js"
import { setConfirmExitModalOpen } from "../../redux/slices/applicationSlice.js"
import { selectGraphValues, setGraphValues } from "../../redux/slices/droneInfoSlice.js"

export default function Toolbar() {
  const dispatch = useDispatch()
  const [areMenusActive, setMenusActive] = useState(false)
  const [isMac, setIsMac] = useState(false)

  const connectedToDrone = useSelector(selectConnectedToDrone)

  const selectedGraphs = useSelector(selectGraphValues)
  const selectedGraphsRef = useRef(selectedGraphs)

  useEffect(() => {
    selectedGraphsRef.current = selectedGraphs
  }, [selectedGraphs])

  useEffect(() => {
    window.ipcRenderer.invoke("app:is-mac").then((result) => {
      setIsMac(result)
    })
  }, [])

  const GRAPH_KEYS = ["graph_a", "graph_b", "graph_c", "graph_d"]

  const packToSlots = (list) => {
    const next = { graph_a: null, graph_b: null, graph_c: null, graph_d: null }
    for (let i = 0; i < Math.min(list.length, GRAPH_KEYS.length); i++) {
      next[GRAPH_KEYS[i]] = list[i]
    }
    return next
  }

  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleClosed = (_event, payload) => {
      const graphKey = payload?.graphKey
      if (!graphKey) return

      const current = selectedGraphsRef.current
      if (!current) return

      const closedId = current[graphKey]
      if (!closedId) return // already unticked / nothing to do

      // Build ordered list from slots, excluding the closed one
      const remaining = GRAPH_KEYS.map((k) => current[k]).filter(Boolean)
      const nextList = remaining.filter((id) => id !== closedId)

      dispatch(setGraphValues(packToSlots(nextList)))
    }

    window.ipcRenderer.on("app:graph-window:closed", handleClosed)
    return () => {
      window.ipcRenderer.removeListener("app:graph-window:closed", handleClosed)
    }
  }, [dispatch])

  const onClose = () => {
    if (connectedToDrone) {
      dispatch(setConfirmExitModalOpen(true))
    } else {
      window.ipcRenderer.send("window:close", [])
    }
  }

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
              <div>
                <GraphsMenu
                  areMenusActive={areMenusActive}
                  setMenusActive={setMenusActive}
                />
              </div>
              <div>
                <AdvancedMenu
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
                window.ipcRenderer.send("window:minimise", [])
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
                window.ipcRenderer.send("window:maximise", [])
              }}
              label="Maximise"
            >
              <MaximizeIcon className="stroke-slate-400" />
            </div>

            {/* Close */}
            <div
              title="Close"
              className="px-3 flex items-center h-full no-drag cursor-pointer group hover:bg-red-500"
              onClick={() => onClose()}
              label="Close"
            >
              <CloseIcon className="stroke-slate-400 group-hover:stroke-white" />
            </div>
          </div>
        )}
      </div>

      <ConfirmExitModal></ConfirmExitModal>
    </>
  )
}
