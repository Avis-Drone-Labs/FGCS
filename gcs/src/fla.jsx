/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { useEffect, useMemo, useState } from "react"

// 3rd Party Imports
import { useDispatch, useSelector } from "react-redux"

// Styling imports
import { hexToRgba } from "./components/fla/utils"

// Custom components and helpers
import { logEventIds } from "./components/fla/logEventIds.js"

import SelectFlightLog from "./components/fla/SelectFlightLog.jsx"
import MainDisplay from "./components/fla/mainDisplay.jsx"
import Layout from "./components/layout.jsx"
import { showErrorNotification } from "./helpers/notification.js"
import {
  selectCustomColors,
  selectBaseChartData,
  selectMessageFilters,
  // Selectors
  setAircraftType,
  setCanSavePreset,
  setColorIndex,
  setCustomColors,
  setFile,
  setFlightModeMessages,
  setFormatMessages,
  setBaseChartData,
  setLogEvents,
  setLogMessages,
  setLogType,
  setMessageFilters,
  setMessageMeans,
  setUtcAvailable,
} from "./redux/slices/logAnalyserSlice.js"

export default function FLA() {
  // Redux
  const dispatch = useDispatch()
  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)
  const baseChartData = useSelector(selectBaseChartData)

  // Local states
  const [chartData, setLocalChartData] = useState({ datasets: [] })

  /**
   * Dispatch the lightweight summary info to Redux
   */
  async function getLogSummary(result) {
    const { summary } = result
    if (!summary) {
      showErrorNotification("Error loading file, no summary found.")
      return
    }
    dispatch(setLogType(summary.logType))
    dispatch(setAircraftType(summary.aircraftType))
    dispatch(setFormatMessages(summary.formatMessages))
    dispatch(setFlightModeMessages(summary.flightModeMessages))
    dispatch(setUtcAvailable(summary.utcAvailable))
    dispatch(setMessageFilters(summary.messageFilters))
    dispatch(setMessageMeans(summary.messageMeans))
    dispatch(
      setLogEvents(
        summary.logEvents.map((event) => ({
          time: event.TimeUS,
          message: logEventIds[event.Id],
        })),
      ),
    )
    dispatch(setBaseChartData([]))
  }

  // Close file
  function closeLogFile() {
    dispatch(setFile(null))
    dispatch(setLogMessages(null))
    setLocalChartData({ datasets: [] })
    dispatch(setMessageFilters(null))
    dispatch(setCustomColors({}))
    dispatch(setUtcAvailable(false))
    dispatch(setColorIndex(0))
    dispatch(setLogEvents(null))
    dispatch(setLogType("dataflash"))
    dispatch(setCanSavePreset(false))
    dispatch(setBaseChartData([]))
  }

  // Step 1: Memoize the calculation of which labels are currently requested.
  // This loop only runs when `messageFilters` changes.
  const requestedLabels = useMemo(() => {
    if (!messageFilters) return new Set()

    const labels = new Set()
    Object.keys(messageFilters).forEach((categoryName) => {
      const category = messageFilters[categoryName]
      Object.keys(category).forEach((fieldName) => {
        if (category[fieldName]) {
          labels.add(`${categoryName}/${fieldName}`)
        }
      })
    })
    return labels
  }, [messageFilters])

  // Step 2: A dedicated effect for fetching missing data.
  // This only runs if the set of requestedLabels changes.
  useEffect(() => {
    const cachedLabels = new Set((baseChartData || []).map((d) => d.label))

    const labelsToFetch = [...requestedLabels].filter(
      (label) => !cachedLabels.has(label),
    )

    if (labelsToFetch.length > 0) {
      console.log("Cache miss. Fetching:", labelsToFetch)
      const fetchMissingData = async () => {
        const newDatasets = await window.ipcRenderer.invoke(
          "fla:get-messages",
          labelsToFetch,
        )

        if (Array.isArray(newDatasets) && newDatasets.length > 0) {
          dispatch(setBaseChartData([...(baseChartData || []), ...newDatasets]))
        }
      }
      fetchMissingData()
    }
  }, [requestedLabels, baseChartData, dispatch])

  // Step 3: Memoize the final chart data.
  // This filters the master cache and applies colors. It only re-runs if
  // the data we need (baseChartData) or how it looks (customColors) changes.
  const visibleDataWithColors = useMemo(() => {
    if (!baseChartData) return []

    const toChartPoints = (ds) => {
      // If already in Chart.js format, return as is
      if (Array.isArray(ds.data)) return ds.data
      // If typed arrays present, build point objects lazily for visible series only
      if (ds && ds.x instanceof Float64Array && ds.y instanceof Float32Array) {
        const len = Math.min(ds.x.length, ds.y.length)
        const points = new Array(len)
        for (let i = 0; i < len; i++) {
          points[i] = { x: ds.x[i], y: ds.y[i] }
        }
        return points
      }
      // Last resort: empty
      return []
    }

    return baseChartData
      .filter((dataset) => requestedLabels.has(dataset.label))
      .map((dataset) => {
        const color = customColors[dataset.label] || "#000000"
        const chartData = toChartPoints(dataset)
        return {
          // Preserve label and unit; ensure .data is present for Chart.js
          label: dataset.label,
          yAxisID: dataset.yAxisID,
          data: chartData,
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.5),
        }
      })
  }, [baseChartData, customColors, requestedLabels])

  // Step 4: Update the chart's state.
  // This is now very simple and just syncs the memoized data to the local state.
  useEffect(() => {
    setLocalChartData({ datasets: visibleDataWithColors })
  }, [visibleDataWithColors])

  return (
    <Layout currentPage="fla">
      {messageFilters === null ? (
        <SelectFlightLog getLogSummary={getLogSummary} />
      ) : (
        <MainDisplay closeLogFile={closeLogFile} chartData={chartData} />
      )}
    </Layout>
  )
}
