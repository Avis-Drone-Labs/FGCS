/*
  This file contains the different graph configs for the different types of log files opened with FLA.
  For example, a different log file can have a different x axis (time or linear), etc.
*/

// 3rd party imports
import moment from 'moment'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function microsecondsToDisplayTime(microseconds, roundTo) {
  var seconds = microseconds / 1_000_000
  var mins = Math.floor(seconds / 60)

  return `${String(mins).padStart(2, '0')}:${String(
    (seconds % 60).toFixed(roundTo),
  ).padStart(2, '0')}`
}

const defaultOptions = {
  responsive: true,
  parsing: false,
  animation: false,
  plugins: {
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

export const dataflashOptions = {
  ...defaultOptions,
  plugins: {
    ...defaultOptions.plugins,
    tooltip: {
      callbacks: {
        title: function (context) {
          return microsecondsToDisplayTime(context[0].parsed.x, 5)
        },
      },
    },
  },
  scales: {
    ...defaultOptions.scales,
    x: {
      ...defaultOptions.scales.x,
      ticks: {
        callback: (label) => microsecondsToDisplayTime(label, 0),
        stepSize: 10_000_000,
      },
      title: {
        display: true,
        text: 'Time since boot (mm:ss)',
      },
    },
  },
}

export const fgcsOptions = {
  ...defaultOptions,
  plugins: {
    ...defaultOptions.plugins,
    tooltip: {
      callbacks: {
        title: function (context) {
          return moment(context[0].parsed.x).format('HH:mm:ss')
        },
      },
    },
  },
  scales: {
    ...defaultOptions.scales,
    x: {
      ...defaultOptions.scales.x,
      type: 'time',
      time: {
        unit: 'second',
        displayFormats: {
          second: 'HH:mm:ss',
        },
      },
      ticks: {
        stepSize: 10,
      },
      title: {
        display: true,
        text: 'Time',
      },
    },
  },
}
