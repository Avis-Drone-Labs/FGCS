import "chartjs-adapter-moment"

import ChartStreaming from "@robloche/chartjs-plugin-streaming"
import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js"
import { forwardRef, useEffect, useState } from "react"
import { Scatter } from "react-chartjs-2"

ChartJS.register(
  Title,
  Legend,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ChartStreaming,
)

ChartJS.defaults.color = "#fafafa"

// Helper function to convert hex color to rgba
function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  showLine: true,
  animation: false,
  plugins: {
    legend: {
      position: "top",
    },
    streaming: {
      duration: 20000,
      frameRate: 30,
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "second",
      },
      ticks: {
        callback: function (value) {
          // Only show every 10 seconds, avoid creating Date unless needed
          const timestamp = this.getLabelForValue(value);
          const date = new Date(timestamp);
          return date.getSeconds() % 10 === 0 ? date.toLocaleTimeString() : null;
        },
      },
    },
  },
  elements: {
    line: {
      borderWidth: 1,
    },
    point: {
      radius: 0,
      hitRadius: 10,
    },
  },
}

const RealtimeGraph = forwardRef(function RealtimeGraph(
  { datasetLabel, lineColor },
  ref,
) {
  const [chartData] = useState({
    datasets: [
      {
        label: datasetLabel,
        borderColor: lineColor,
        backgroundColor: hexToRgba(lineColor, 0.5),
        data: [],
      },
    ],
  })

  useEffect(() => {
    if (ref.current) {
      ref.current.data.datasets[0].label = datasetLabel
      ref.current.update("quiet")
    }
  }, [datasetLabel])

  return (
    <div className="p-8 rounded-lg w-full h-full">
      <Scatter ref={ref} options={options} data={chartData} />
    </div>
  )
})

export default RealtimeGraph
