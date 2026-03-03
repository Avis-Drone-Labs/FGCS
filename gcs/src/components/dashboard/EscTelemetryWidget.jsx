/*
  Floating ESC telemetry widget (same positioning + UI pattern as VideoWidget)
*/
import { useMemo, useState } from "react"
import { ActionIcon, Text } from "@mantine/core"
import {
  IconBolt,
  IconMaximize,
  IconMinus,
  IconResize,
} from "@tabler/icons-react"
import { useSelector } from "react-redux"
import GetOutsideVisibilityColor from "../../helpers/outsideVisibility"
import { selectEscTelemetry } from "../../redux/slices/droneInfoSlice"

function fmt(value, decimals = 0) {
  if (value === null || value === undefined) return "—"
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(decimals)
}

function fmtTemp(value) {
  if (value === null || value === undefined) return "—"
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  const degC = n > 200 ? n / 100.0 : n
  return degC.toFixed(0)
}

function EscTile({ esc }) {
  return (
    <div className="rounded-md border border-falcongrey-700 bg-falcongrey-900 p-2">
      <div className="flex flex-row items-center justify-between mb-1">
        <div className="text-slate-200 text-xs font-semibold">
          ESC {esc.escId}
        </div>
        <div className="text-slate-500 text-[10px]">
          {esc.timestamp ? new Date(esc.timestamp).toLocaleTimeString() : "—"}
        </div>
      </div>

      <div className="flex flex-col gap-y-0.5">
        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">RPM</div>
          <div className="text-slate-200 text-xs">{fmt(esc.rpm, 0)}</div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">A</div>
          <div className="text-slate-200 text-xs">{fmt(esc.current, 2)}</div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">V</div>
          <div className="text-slate-200 text-xs">{fmt(esc.voltage, 2)}</div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">°C</div>
          <div className="text-slate-200 text-xs">{fmtTemp(esc.temperature)}</div>
        </div>
      </div>
    </div>
  )
}

export default function EscTelemetryWidget({ telemetryPanelWidth }) {
  const escs = useSelector(selectEscTelemetry)

  const [isMaximized, setIsMaximized] = useState(false)
  const [scale, setScale] = useState(1)

  const dimensions = useMemo(() => {
    const baseWidth = 350
    const width = baseWidth * scale
    // make it a bit taller than video default so 2 rows of tiles fit nicely
    const height = Math.round((197 * 1.15) * scale)
    return { width, height }
  }, [scale])

  const hasAnyData =
    Array.isArray(escs) &&
    escs.some(
      (e) =>
        e &&
        (e.rpm != null ||
          e.current != null ||
          e.voltage != null ||
          e.temperature != null),
    )

  function handleResizeStart(e) {
    const startX = e.clientX
    const startScale = scale

    const handleMouseMove = (ev) => {
      const deltaX = ev.clientX - startX
      const scaleChange = deltaX / 200
      const newScale = startScale + scaleChange
      const clamped = Math.max(1, Math.min(3, newScale))
      setScale(clamped)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Minimized view
  if (!isMaximized) {
    return (
      <div className="rounded-md" style={{ background: GetOutsideVisibilityColor() }}>
        <div className="p-2 flex items-center gap-2">
          <IconBolt size={16} className={hasAnyData ? "text-slate-200" : "text-slate-500"} />
          <Text size="sm" className="truncate max-w-[150px]">
            {hasAnyData ? "ESC telemetry" : "No ESC telemetry"}
          </Text>

          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => setIsMaximized(true)}
            className="text-slate-400 hover:text-slate-200"
            title="Maximize ESC widget"
          >
            <IconMaximize size={16} />
          </ActionIcon>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <div
        className="min-w-[350px] rounded-md"
        style={{ background: GetOutsideVisibilityColor() }}
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <Text>ESC telemetry</Text>

          <div className="flex items-center gap-1">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => setIsMaximized(false)}
              className="text-slate-400 hover:text-slate-200"
              title="Minimize ESC widget"
            >
              <IconMinus size={16} />
            </ActionIcon>

            <ActionIcon
              size="sm"
              variant="subtle"
              onMouseDown={handleResizeStart}
              className="text-slate-400 hover:text-slate-200 hover:cursor-ne-resize"
              title="Drag to resize"
            >
              <IconResize size={16} />
            </ActionIcon>
          </div>
        </div>

        <div
          className="rounded overflow-hidden mx-auto"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            minHeight: "128px",
          }}
        >
          {!hasAnyData ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <IconBolt size={24} className="text-slate-500 mb-1" />
              <Text size="sm">Waiting for ESC telemetry</Text>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-2">
              <div className="grid grid-cols-4 gap-2">
                {escs.map((esc) => (
                  <EscTile key={esc.escId} esc={esc} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
