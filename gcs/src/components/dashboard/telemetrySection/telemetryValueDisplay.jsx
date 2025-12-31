import { Tooltip } from "@mantine/core"

export default function TelemetryValueDisplay({
  title,
  value,
  fs,
  tooltipText = null,
}) {
  return (
    <Tooltip label={tooltipText} disabled={tooltipText === null}>
      <p
        className="font-bold cursor-default"
        style={{ fontSize: `${fs * 1.5}rem`, lineHeight: `${fs * 1.75}rem` }}
      >
        {title} <br /> {value}
      </p>
    </Tooltip>
  )
}
