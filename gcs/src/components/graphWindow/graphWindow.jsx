import { useEffect, useState } from "react"

export default function GraphWindow() {
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    window.ipcRenderer.on("app:graph-window:init", (_event, data) => {
      setMeta(data)
    })
  }, [])

  return (
    <div className="w-full h-full bg-falcongrey-800 p-4">
      <div className="text-lg">{meta?.title ?? "Graph"}</div>
      <div className="text-sm text-falcongray-90 opacity-70">
        {meta?.id ?? ""}
      </div>
      <div className="text-sm text-falcongray-90 opacity-70 mt-1">
        {meta?.description ?? ""}
      </div>
      <div className="mt-6 opacity-70">Graph goes here later.</div>
    </div>
  )
}
