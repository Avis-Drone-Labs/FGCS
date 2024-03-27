import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core'
import { IconZoomIn, IconZoomOut, IconZoomReset } from '@tabler/icons-react'
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
import zoomPlugin from 'chartjs-plugin-zoom'
import { useRef } from 'react'
import { Line } from 'react-chartjs-2'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

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

export default function Graph({ data }) {
  const chartRef = useRef(null)

  return (
    <div>
      <Line ref={chartRef} options={options} data={data} />
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
      </div>
    </div>
  )
}
