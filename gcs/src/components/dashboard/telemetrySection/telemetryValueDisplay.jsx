export default function TelemetryValueDisplay({ title, value, fs, widthCh=8 }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bold" style={{ lineHeight: `${fs * 1.2}rem` }}>
        {title}
      </span>

      {/* value: fixed width, center-aligned, tabular digits */}
      <span
        className="block font-bold text-center tabular-nums"
        style={{
          fontSize: `${fs * 1.25}rem`,
          lineHeight: `${fs * 1.75}rem`,
          width: `${widthCh}ch`, // reserve space, e.g. "-999.99" approx 8ch
        }}
        aria-label={`${title} value`}
      >
        {value}
      </span>
    </div>
  )
}
