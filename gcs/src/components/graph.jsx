import 'chartjs-adapter-moment'

import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useEffect, useRef, useState } from 'react'

import moment from 'moment'
import { Scatter } from 'react-chartjs-2'

ChartJS.register(
  Title,
  Legend,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
)

ChartJS.defaults.color = '#fafafa'

const options = {
  responsive: true,
  showLine: true,
  animation: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'second',
        displayFormats: {
          second: 'HH:mm:ss',
        },
      },
      ticks: {
        callback: (value, index, ticks) => {
          // show tick if last, middle and first index
          if (
            index === 0 ||
            index === ticks.length - 1 ||
            index === Math.floor(ticks.length / 2)
          ) {
            return moment(value).format('hh:mm:ss')
          }
          return null
        },
      },
    },
  },
  elements: {
    line: {
      borderWidth: 1,
    },
    point: {
      radius: 2,
      borderWidth: 0,
      hoverBorderWidth: 0,
      hitRadius: 10,
    },
  },
}

export default function Graph({
  data,
  datasetLabel = '#ffffff',
  lineColor = '#e5e5e5',
  pointColor = '#fafafa',
  className = 'p-8 rounded-lg w-full',
  ...props
}) {
  const [chartData] = useState({
    datasets: [
      {
        label: 'Unknown dataset',
        data: [],
      },
    ],
  })
  const chartRef = useRef()

  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.data.datasets[0].label = datasetLabel
    chartRef.current.data.datasets[0].borderColor = lineColor
    chartRef.current.data.datasets[0].backgroundColor = pointColor
  }, [datasetLabel, lineColor, pointColor, chartRef])

  useEffect(() => {
    if (!data || !chartRef.current) return

    chartRef.current.data.datasets[0].data = data.slice(-250)
    chartRef.current.update()
  }, [data, chartRef])

  return (
    <div className={`${className}`} {...props}>
      <div className='bg-falcongrey-80 rounded-lg h-auto'>
        <Scatter
          className='h'
          ref={chartRef}
          options={options}
          data={chartData}
        />
      </div>
    </div>
  )
}
