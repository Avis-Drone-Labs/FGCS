/*
  Data Display. This is a collection of helpful functions to generate the styling for the numbers seen
  in the "Data" tab on the LH resizable section.
*/

// 3rd Party Imports
import { Tooltip } from "@mantine/core"

// Helper Functions
import { dataFormatters } from "./dataFormatters"

const colorPalette = [
  "#36a2eb",
  "#ff6383",
  "#fe9e40",
  "#4ade80",
  "#ffcd57",
  "#4cbfc0",
  "#9966ff",
  "#c8cbce",
]

export function to2dp(num) {
  // https://stackoverflow.com/questions/4187146/truncate-number-to-two-decimal-places-without-rounding
  return num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
}

export function DataMessage({ label, value, currentlySelected, id }) {
  let color = colorPalette[id % colorPalette.length]

  var formattedValue = to2dp(value)

  if (currentlySelected in dataFormatters) {
    formattedValue = to2dp(dataFormatters[currentlySelected](value))
  }

  return (
    <Tooltip label={currentlySelected}>
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm text-center">{label}</p>
        <p className="text-5xl" style={{ color: color }}>
          {formattedValue}
        </p>
      </div>
    </Tooltip>
  )
}
