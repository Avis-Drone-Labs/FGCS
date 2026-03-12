/*
  Floating ESC telemetry widget (row-positioned like VideoWidget)
*/
import { useMemo, useState } from "react"
import { ActionIcon, NumberInput, Popover, Stack, Text } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import {
  IconBolt,
  IconMaximize,
  IconMinus,
  IconResize,
  IconSettings,
} from "@tabler/icons-react"
import { useSelector } from "react-redux"
import GetOutsideVisibilityColor from "../../helpers/outsideVisibility"
import { selectEscTelemetry } from "../../redux/slices/droneInfoSlice"

const DEFAULT_ESC_THRESHOLDS = {
  rpm: {
    warning: 2000,
    danger: 1000,
    higherIsBetter: true,
  },
  current: {
    warning: 15,
    danger: 20,
    higherIsBetter: false,
  },
  temperature: {
    warning: 60,
    danger: 80,
    higherIsBetter: false,
  },
}

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

function getThresholdColor(value, config) {
  if (value === null || value === undefined) return "text-slate-200"

  const n = Number(value)
  if (!Number.isFinite(n)) return "text-slate-200"

  if (config.higherIsBetter) {
    if (n <= config.danger) return "text-red-400"
    if (n <= config.warning) return "text-yellow-400"
    return "text-green-400"
  }

  if (n >= config.danger) return "text-red-400"
  if (n >= config.warning) return "text-yellow-400"
  return "text-green-400"
}

function EscTile({ esc, thresholds }) {
  const rpmClass = getThresholdColor(esc.rpm, thresholds.rpm)
  const currentClass = getThresholdColor(esc.current, thresholds.current)
  const temperatureClass = getThresholdColor(
    esc.temperature,
    thresholds.temperature,
  )

  return (
    <div className="rounded-md border border-falcongrey-700 bg-falcongrey-900 p-2">
      <div className="flex flex-row items-center justify-between mb-1">
        <div className="text-slate-200 text-xs font-semibold">
          ESC {esc.escId}
        </div>
      </div>

      <div className="flex flex-col gap-y-0.5">
        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">RPM</div>
          <div className={`text-xs ${rpmClass}`}>{fmt(esc.rpm, 0)}</div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">A</div>
          <div className={`text-xs ${currentClass}`}>{fmt(esc.current, 2)}</div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="text-slate-500 text-[10px]">°C</div>
          <div className={`text-xs ${temperatureClass}`}>
            {fmtTemp(esc.temperature)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EscTelemetryWidget() {
  const escs = useSelector(selectEscTelemetry)

  const [isMaximized, setIsMaximized] = useState(false)
  const [scale, setScale] = useState(1)
  const [settingsOpened, setSettingsOpened] = useState(false)

  const [thresholds, setThresholds] = useLocalStorage({
    key: "escTelemetryThresholds",
    defaultValue: DEFAULT_ESC_THRESHOLDS,
  })

  const hasAnyData =
    Array.isArray(escs) &&
    escs.some(
      (e) => e && (e.rpm != null || e.current != null || e.temperature != null),
    )

  const dimensions = useMemo(() => {
    const baseWidth = 350
    const width = baseWidth * scale

    const cols = 4
    const count = Array.isArray(escs) ? escs.length : 0
    const rows = Math.max(1, Math.ceil(Math.min(count, 8) / cols))

    const tileH = 74 * scale
    const gapH = 8 * scale
    const paddingH = 32 * scale

    const height = Math.round(rows * tileH + (rows - 1) * gapH + paddingH)
    const clampedHeight = Math.max(180 * scale, Math.min(420 * scale, height))

    return { width, height: clampedHeight }
  }, [scale, escs])

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

  function updateThreshold(metric, field, value) {
    const numericValue = Number(value)

    setThresholds((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: Number.isFinite(numericValue)
          ? numericValue
          : prev[metric][field],
      },
    }))
  }

  function resetThresholds() {
    setThresholds(DEFAULT_ESC_THRESHOLDS)
  }

  // Minimized view
  if (!isMaximized) {
    return (
      <div
        className="rounded-md"
        style={{ background: GetOutsideVisibilityColor() }}
      >
        <div className="p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBolt
              size={16}
              className={hasAnyData ? "text-slate-200" : "text-slate-500"}
            />
            <Text size="sm" className="truncate max-w-[150px]">
              {hasAnyData ? "ESC telemetry" : "No ESC telemetry"}
            </Text>
          </div>

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
      className="min-w-[350px] min-h-[253px] rounded-md flex flex-col"
      style={{ background: GetOutsideVisibilityColor() }}
    >
      <div className="p-2 h-full flex flex-col">
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

            <Popover
              opened={settingsOpened}
              onChange={setSettingsOpened}
              position="top"
              withArrow
              shadow="md"
              width={260}
            >
              <Popover.Target>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSettingsOpened((o) => !o)}
                  className="text-slate-400 hover:text-slate-200"
                  title="ESC threshold settings"
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Popover.Target>

              <Popover.Dropdown>
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    ESC Thresholds
                  </Text>

                  <Text size="xs" fw={600}>
                    RPM
                  </Text>
                  <NumberInput
                    label="Warning"
                    value={thresholds.rpm.warning}
                    onChange={(value) =>
                      updateThreshold("rpm", "warning", value)
                    }
                    allowDecimal={false}
                  />
                  <NumberInput
                    label="Danger"
                    value={thresholds.rpm.danger}
                    onChange={(value) =>
                      updateThreshold("rpm", "danger", value)
                    }
                    allowDecimal={false}
                  />

                  <Text size="xs" fw={600}>
                    Current (A)
                  </Text>
                  <NumberInput
                    label="Warning"
                    value={thresholds.current.warning}
                    onChange={(value) =>
                      updateThreshold("current", "warning", value)
                    }
                    decimalScale={2}
                  />
                  <NumberInput
                    label="Danger"
                    value={thresholds.current.danger}
                    onChange={(value) =>
                      updateThreshold("current", "danger", value)
                    }
                    decimalScale={2}
                  />

                  <Text size="xs" fw={600}>
                    Temperature (°C)
                  </Text>
                  <NumberInput
                    label="Warning"
                    value={thresholds.temperature.warning}
                    onChange={(value) =>
                      updateThreshold("temperature", "warning", value)
                    }
                    allowDecimal={false}
                  />
                  <NumberInput
                    label="Danger"
                    value={thresholds.temperature.danger}
                    onChange={(value) =>
                      updateThreshold("temperature", "danger", value)
                    }
                    allowDecimal={false}
                  />

                  <Text
                    size="xs"
                    c="blue"
                    className="cursor-pointer text-center w-full"
                    onClick={resetThresholds}
                  >
                    Reset thresholds
                  </Text>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </div>
        </div>

        <div
          className="rounded overflow-hidden mx-auto flex-1"
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
              <div className="grid grid-cols-4 gap-2 justify-items-center">
                {escs.map((esc) => (
                  <EscTile key={esc.escId} esc={esc} thresholds={thresholds} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
