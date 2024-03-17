import { Button } from '@mantine/core'
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
        text: 'Time since boot (min:sec)',
      },
    },
  },
  elements: {
    point: {
      radius: 0.75,
    },
    line: {
      borderWidth: 1,
    },
  },
}

export default function Graph({ logMessages }) {
  const chartRef = useRef(null)

  const data = {
    datasets: [
      {
        label: 'Roll',
        data: logMessages.map((d) => ({ x: d.TimeUS, y: d.Roll })),
      },
    ],
  }

  return (
    <div>
      <Line ref={chartRef} options={options} data={data} />
      <Button onClick={chartRef?.current?.resetZoom}>Reset zoom</Button>
    </div>
  )
}
