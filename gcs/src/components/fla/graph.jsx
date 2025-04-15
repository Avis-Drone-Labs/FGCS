/*
This graph component is responsible for rendering the graph for FLA. It includes
a toolbar for different graph actions such as zooming and screenshotting, as well
as graph annotations to show events or different flight modes.
*/

// Base imports
import { useEffect, useRef, useState } from "react"

// 3rd party imports
import { ActionIcon, Tooltip as MantineTooltip, Button } from "@mantine/core"
import { useToggle } from "@mantine/hooks"
import {
  IconCapture,
  IconCopy,
  IconTimelineEvent,
  IconTimelineEventX,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from "@tabler/icons-react"
import {
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import annotationPlugin from "chartjs-plugin-annotation"
import zoomPlugin from "chartjs-plugin-zoom"
import createColormap from "colormap"
import { Line } from "react-chartjs-2"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"

// Custom components and helpers
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../helpers/mavlinkConstants.js"
import { showSuccessNotification } from "../../helpers/notification.js"

// https://www.chartjs.org/docs/latest/configuration/canvas-background.html#color
// Note: changes to the plugin code is not reflected to the chart, because the plugin is loaded at chart construction time and editor changes only trigger an chart.update().
const customCanvasBackgroundColor = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart) => {
    const { ctx } = chart
    ctx.save()
    ctx.globalCompositeOperation = "destination-over"
    ctx.fillStyle = tailwindColors.falcongrey[800]
    ctx.fillRect(0, 0, chart.width, chart.height)
    ctx.restore()
  },
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  zoomPlugin,
  customCanvasBackgroundColor,
  annotationPlugin,
)

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Graph({
  data,
  events,
  flightModes,
  graphConfig,
  clearFilters,
  canSavePreset,
  openPresetModal,
}) {
  const [config, setConfig] = useState({ ...graphConfig })
  const [showEvents, toggleShowEvents] = useToggle()
  const chartRef = useRef(null)

  function downloadUpscaledImage(originalDataURI, wantedWidth, wantedHeight) {
    // https://stackoverflow.com/questions/20958078/resize-a-base-64-image-in-javascript-without-using-canvas
    // We create an image to receive the Data URI
    var img = document.createElement("img")

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
      // We create a canvas and get its context.
      var canvas = document.createElement("canvas")
      var ctx = canvas.getContext("2d")

      // We set the dimensions at the wanted size.
      canvas.width = wantedWidth
      canvas.height = wantedHeight

      // We resize the image with the canvas method drawImage();
      ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight)

      var upscaledDataUri = canvas.toDataURL()

      const link = document?.createElement("a")
      link.download = "graph.png"

      link.href = upscaledDataUri

      link.click()
    }

    // We put the Data URI in the image's src attribute
    img.src = originalDataURI
  }

  function downloadGraphAsImage() {
    const height = chartRef?.current?.height
    const width = chartRef?.current?.width
    downloadUpscaledImage(
      chartRef?.current?.toBase64Image(),
      width * 2,
      height * 2,
    )
  }

  function copyGraphToClipboard() {
    try {
      const height = chartRef?.current?.height
      const width = chartRef?.current?.width
      const wantedWidth = width * 2
      const wantedHeight = height * 2

      // https://stackoverflow.com/questions/20958078/resize-a-base-64-image-in-javascript-without-using-canvas
      // We create an image to receive the Data URI
      var img = document.createElement("img")

      // When the event "onload" is triggered we can resize the image.
      img.onload = function () {
        // We create a canvas and get its context.
        var canvas = document.createElement("canvas")
        var ctx = canvas.getContext("2d")

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth
        canvas.height = wantedHeight

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight)

        canvas.toBlob((blob) => {
          navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])

          showSuccessNotification("Graph copied to clipboard")
        })
      }

      img.src = chartRef?.current?.toBase64Image()
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    setConfig({ ...graphConfig })
  }, [graphConfig])

  useEffect(() => {
    const annotations = []

    if (events !== null) {
      events.forEach((event) => {
        annotations.push({
          type: "line",
          mode: "vertical",
          scaleID: "x",
          value: event.time,
          borderColor: tailwindColors.red[500],
          borderWidth: 1,
          borderDash: [6, 6],
          borderDashOffset: 0,
          display: showEvents,
          label: {
            backgroundColor: tailwindColors.gray[800],
            content: event.message,
            display: showEvents,
            position: "start",
          },
        })
      })
    }

    if (flightModes?.length && data?.datasets?.length) {
      const colors = createColormap({
        colormap: "hsv",
        nshades: Math.max(11, flightModes.length), // HSV map requires at least 11 shades
        format: "rgbaString",
        alpha: 0.035,
      })
      const flightModeColorsMap = {}
      flightModes.forEach((flightMode, index) => {
        if (flightMode.name === "MODE") {
          flightModeColorsMap[flightMode.Mode] = colors[index]
        } else if (flightMode.name === "HEARTBEAT") {
          // Check if the flight mode is a plane or copter to select the correct flight mode
          if (flightMode === 1) {
            flightModeColorsMap[
              PLANE_MODES_FLIGHT_MODE_MAP[flightMode.custom_mode]
            ] = colors[index]
          } else {
            flightModeColorsMap[
              COPTER_MODES_FLIGHT_MODE_MAP[flightMode.custom_mode]
            ] = colors[index]
          }
        }
      })

      // Create a box annotation to show the different flight modes
      for (let i = 0; i < flightModes.length; i++) {
        const flightMode = flightModes[i]
        const nextFlightMode = flightModes[i + 1]

        // Depending on log file, set different annotation config options
        var labelContent = ""
        var xMax = "end"
        if (flightMode.name === "MODE") {
          labelContent = flightMode.Mode
        } else if (flightMode.name === "HEARTBEAT") {
          // Check if the flight mode is a plane or copter to select the correct flight mode
          if (flightMode === 1) {
            labelContent = PLANE_MODES_FLIGHT_MODE_MAP[flightMode.custom_mode]
          } else {
            labelContent = COPTER_MODES_FLIGHT_MODE_MAP[flightMode.custom_mode]
          }
          xMax = flightModes[0].TimeUS
        }

        const backgroundColor = flightModeColorsMap[labelContent]

        // https://stackoverflow.com/a/8179549/10077669
        const labelColor = backgroundColor.replace(/[^,]+(?=\))/, "1")

        const flightModeChange = {
          type: "box",
          xScaleID: "x",
          yMin: "end",
          yMax: "start",
          xMin: flightMode.TimeUS,
          xMax: xMax,
          backgroundColor: backgroundColor,
          borderWidth: 0,
          display: true,
          z: -100,
          label: {
            backgroundColor: tailwindColors.gray[800],
            content: labelContent,
            display: true,
            position: { y: "end", x: "start" },
            color: labelColor,
          },
        }

        // If there is a next flight mode, then set the xMax of the current flight
        // mode to the xMin of the next flight mode
        if (nextFlightMode !== undefined) {
          flightModeChange.xMax = nextFlightMode.TimeUS
        }

        annotations.push(flightModeChange)
      }
    }

    const yAxisIDs = [
      ...new Set(data.datasets.map((dataset) => dataset.yAxisID)),
    ]
    const scales = {}

    if (yAxisIDs.length === 0) {
      scales.y = {
        grid: { color: tailwindColors.gray[500] },
      }
    } else {
      delete graphConfig.scales.y
    }

    yAxisIDs.forEach((yAxisID, index) => {
      scales[yAxisID] = {
        position: "left", // Only on Left
        grid: {
          color: tailwindColors.gray[500],
          drawOnChartArea: index === 0, // Only draw grid lines for the first axis
        },
        title: {
          display: true,
          text: yAxisID,
        },
      }
    })

    scales.x = { ...config.scales.x }

    setConfig({
      ...config,
      scales: {
        ...scales,
      },
      plugins: {
        ...config.plugins,
        annotation: {
          annotations: annotations,
        },
      },
    })
  }, [events, showEvents, flightModes, data])

  return (
    <div>
      <Line ref={chartRef} options={config} data={data} />
      <div className="flex flex-row gap-2 pt-2">
        <MantineTooltip label="Zoom in">
          <ActionIcon
            variant="filled"
            onClick={() => chartRef?.current?.zoom(1.5)}
            size={32}
          >
            <IconZoomIn size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label="Zoom out">
          <ActionIcon
            variant="filled"
            onClick={() => chartRef?.current?.zoom(0)}
            size={32}
          >
            <IconZoomOut size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label="Zoom reset">
          <ActionIcon
            size={32}
            variant="filled"
            onClick={chartRef?.current?.resetZoom}
          >
            <IconZoomReset size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label="Save graph as image">
          <ActionIcon size={32} variant="filled" onClick={downloadGraphAsImage}>
            <IconCapture size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label="Copy graph">
          <ActionIcon size={32} variant="filled" onClick={copyGraphToClipboard}>
            <IconCopy size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label={showEvents ? "Hide events" : "Show events"}>
          <ActionIcon size={32} variant="filled" onClick={toggleShowEvents}>
            {showEvents ? (
              <IconTimelineEventX size={18} />
            ) : (
              <IconTimelineEvent size={18} />
            )}
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label="Clear Filters">
          <Button
            className="min-h-8 max-h-8"
            color={tailwindColors.red[500]}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </MantineTooltip>
        {canSavePreset && (
          <MantineTooltip label="Save Preset">
            <Button
              className="min-h-8 max-h-8"
              color={tailwindColors.green[600]}
              onClick={() => {
                openPresetModal()
              }}
            >
              Save Preset
            </Button>
          </MantineTooltip>
        )}
      </div>
    </div>
  )
}
