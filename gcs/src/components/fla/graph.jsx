import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core'
import { useToggle } from '@mantine/hooks'
import {
  IconCapture,
  IconTimelineEvent,
  IconTimelineEventX,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from '@tabler/icons-react'
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
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

// https://www.chartjs.org/docs/latest/configuration/canvas-background.html#color
// Note: changes to the plugin code is not reflected to the chart, because the plugin is loaded at chart construction time and editor changes only trigger an chart.update().
const customCanvasBackgroundColor = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart) => {
    const { ctx } = chart
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#242424'
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

function microsecondsToDisplayTime(microseconds, roundTo) {
  var seconds = microseconds / 1_000_000
  var mins = Math.floor(seconds / 60)

  return `${String(mins).padStart(2, '0')}:${String(
    (seconds % 60).toFixed(roundTo),
  ).padStart(2, '0')}`
}

const options = {
  responsive: true,
  parsing: false,
  animation: false,
  plugins: {
    tooltip: {
      callbacks: {
        title: function (context) {
          return microsecondsToDisplayTime(context[0].parsed.x, 5)
        },
      },
    },
    colors: {
      forceOverride: true,
    },
    zoom: {
      pan: {
        enabled: true,
        mode: 'xy',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'xy',
      },
    },
  },
  scales: {
    x: {
      type: 'linear',
      ticks: {
        callback: (label) => microsecondsToDisplayTime(label, 0),
        stepSize: 10_000_000,
      },
      title: {
        display: true,
        text: 'Time since boot (mm:ss)',
      },
      grid: { color: tailwindColors.gray[600] },
    },
    y: {
      grid: { color: tailwindColors.gray[600] },
    },
  },
  elements: {
    point: {
      radius: 0,
    },
    line: {
      borderWidth: 1,
    },
  },
}

export default function Graph({ data, events }) {
  const [config, setConfig] = useState({ ...options })
  const [showEvents, toggleShowEvents] = useToggle()
  const chartRef = useRef(null)

  function downloadUpscaledImage(originalDataURI, wantedWidth, wantedHeight) {
    // https://stackoverflow.com/questions/20958078/resize-a-base-64-image-in-javascript-without-using-canvas
    // We create an image to receive the Data URI
    var img = document.createElement('img')

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
      // We create a canvas and get its context.
      var canvas = document.createElement('canvas')
      var ctx = canvas.getContext('2d')

      // We set the dimensions at the wanted size.
      canvas.width = wantedWidth
      canvas.height = wantedHeight

      // We resize the image with the canvas method drawImage();
      ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight)

      var upscaledDataUri = canvas.toDataURL()

      const link = document?.createElement('a')
      link.download = 'graph.png'

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

  useEffect(() => {
    if (events !== null) {
      const annotations = events.map((event) => {
        return {
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
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
            position: 'start',
          },
        }
      })

      setConfig({
        ...config,
        plugins: {
          ...config.plugins,
          annotation: {
            annotations: annotations,
          },
        },
      })
    }
  }, [events, showEvents])

  return (
    <div>
      <Line ref={chartRef} options={config} data={data} />
      <div className='flex flex-row gap-2'>
        <MantineTooltip label='Zoom in'>
          <ActionIcon
            variant='filled'
            onClick={() => chartRef?.current?.zoom(1.5)}
          >
            <IconZoomIn size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label='Zoom out'>
          <ActionIcon
            variant='filled'
            onClick={() => chartRef?.current?.zoom(0)}
          >
            <IconZoomOut size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label='Zoom reset'>
          <ActionIcon variant='filled' onClick={chartRef?.current?.resetZoom}>
            <IconZoomReset size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label='Save graph as image'>
          <ActionIcon variant='filled' onClick={downloadGraphAsImage}>
            <IconCapture size={18} />
          </ActionIcon>
        </MantineTooltip>
        <MantineTooltip label={showEvents ? 'Hide events' : 'Show events'}>
          <ActionIcon variant='filled' onClick={toggleShowEvents}>
            {showEvents ? (
              <IconTimelineEventX size={18} />
            ) : (
              <IconTimelineEvent size={18} />
            )}
          </ActionIcon>
        </MantineTooltip>
      </div>
    </div>
  )
}
