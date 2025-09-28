/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { useEffect, useMemo, useState } from "react"

// 3rd Party Imports
import { useDispatch, useSelector } from "react-redux"

// Styling imports
import {
  buildDefaultMessageFilters,
  calcGPSOffset,
  calculateMeanValues,
  clearUnitCache,
  convertTimeUStoUTC,
  getUnit,
  hexToRgba,
  processFlightModes,
  sortObjectByKeys,
} from "./components/fla/utils"

// Custom components and helpers
import { logEventIds } from "./components/fla/logEventIds.js"

import SelectFlightLog from "./components/fla/SelectFlightLog.jsx"
import MainDisplay from "./components/fla/mainDisplay.jsx"
import Layout from "./components/layout.jsx"
import { showErrorNotification } from "./helpers/notification.js"
import {
  selectCustomColors,
  selectFormatMessages,
  selectLogMessages,
  selectMessageFilters,
  // Selectors
  selectUnits,
  setAircraftType,
  setCanSavePreset,
  setColorIndex,
  setCustomColors,
  setFile,
  setFlightModeMessages,
  setFormatMessages,
  setLogEvents,
  setLogMessages,
  setLogType,
  setMessageFilters,
  setMessageMeans,
  setUnits,
  setUtcAvailable,
} from "./redux/slices/logAnalyserSlice.js"

export default function FLA() {
  // Redux
  const dispatch = useDispatch()
  const units = useSelector(selectUnits)
  const formatMessages = useSelector(selectFormatMessages)
  const logMessages = useSelector(selectLogMessages)
  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)

  // Local states
  const [chartData, setLocalChartData] = useState({ datasets: [] })

  /**
   * Process the entire log file
   */
  async function processLoadedFile(result) {
    clearUnitCache() // Clear cache when loading new file
    const loadedLogMessages = result.messages

    if (!loadedLogMessages) {
      showErrorNotification("Error loading file, no messages found.")
      return
    }

    // 1. Update log and aircraft type
    dispatch(setLogType(result.logType))
    dispatch(setAircraftType(loadedLogMessages.aircraftType))
    delete loadedLogMessages.aircraftType
    dispatch(setLogMessages(loadedLogMessages))

    // 2. Update format and units
    if ("units" in loadedLogMessages)
      dispatch(setUnits(loadedLogMessages["units"]))
    if ("format" in loadedLogMessages)
      dispatch(setFormatMessages(loadedLogMessages["format"]))

    // 3. Process flight modes and set UTC availability
    const flightModeMessages = processFlightModes(result, loadedLogMessages)
    dispatch(setFlightModeMessages(flightModeMessages))
    if (result.logType === "fgcs_telemetry") dispatch(setUtcAvailable(true))

    // 4. Build default message filters. Hover over function name for details.
    let logMessageFilterDefaultState =
      buildDefaultMessageFilters(loadedLogMessages)

    // 5. Expand ESC into separate array based on instance
    const { updatedMessages: messagesWithESC, updatedFilters: filtersWithESC } =
      expandESCMessages(loadedLogMessages, logMessageFilterDefaultState)

    // 6. Convert TimeUS to TimeUTC if GPS data is available (for dataflash logs)
    let tempLoadedLogMessages = { ...messagesWithESC }
    let gpsOffset = null
    if (messagesWithESC.GPS && result.logType === "dataflash") {
      gpsOffset = calcGPSOffset(messagesWithESC)
      if (gpsOffset !== null) {
        tempLoadedLogMessages = convertTimeUStoUTC(
          tempLoadedLogMessages,
          gpsOffset,
        )
        dispatch(setUtcAvailable(true))
        dispatch(setFlightModeMessages(tempLoadedLogMessages.MODE))
      }
    }

    // 7. Expand BAT data into separate arrays based on instance.
    const {
      updatedMessages: finalMessages,
      updatedFilters: finalFilters,
      updatedFormats,
    } = expandBATMessages(
      messagesWithESC,
      tempLoadedLogMessages,
      filtersWithESC,
      gpsOffset,
    )

    // 8. Update Redux
    dispatch(setLogMessages(finalMessages))
    dispatch(setFormatMessages(updatedFormats))
    dispatch(setMessageFilters(sortObjectByKeys(finalFilters)))

    // 9. Calculate and set means and set event logs for the event lines on graph
    const means = calculateMeanValues(loadedLogMessages)
    dispatch(setMessageMeans(means))
    if ("EV" in loadedLogMessages) {
      dispatch(
        setLogEvents(
          loadedLogMessages["EV"].map((event) => ({
            time:
              gpsOffset !== null
                ? event.TimeUS / 1000 + gpsOffset
                : event.TimeUS,
            message: logEventIds[event.Id],
          })),
        ),
      )
    }
  }

  /**
   * Expands ESC messages into separate arrays based on Instance
   */
  function expandESCMessages(logMessages, filterState) {
    const escData = logMessages["ESC"]
    if (!escData?.length) {
      return { updatedMessages: logMessages, updatedFilters: filterState }
    }

    const updatedMessages = { ...logMessages }
    const updatedFilters = { ...filterState }

    escData.forEach((escMessage) => {
      const newEscData = {
        ...escMessage,
        name: `ESC${escMessage["Instance"] + 1}`,
      }

      if (!updatedMessages[newEscData.name]) {
        updatedMessages[newEscData.name] = []
        updatedFilters[newEscData.name] = { ...filterState["ESC"] }
      }

      updatedMessages[newEscData.name].push(newEscData)
    })

    delete updatedMessages["ESC"]
    delete updatedFilters["ESC"]

    return { updatedMessages, updatedFilters }
  }

  /**
   * Expands BAT messages into separate arrays based on Instance
   */
  function expandBATMessages(
    logMessages,
    tempMessages,
    filterState,
    gpsOffset,
  ) {
    if (!logMessages["BAT"]) {
      return {
        updatedMessages: tempMessages,
        updatedFilters: filterState,
        updatedFormats: logMessages["format"],
      }
    }

    const updatedMessages = { ...tempMessages }
    const updatedFilters = { ...filterState }
    const updatedFormats = { ...logMessages["format"] }

    logMessages["BAT"].forEach((battData) => {
      const instanceValue = battData["Instance"] ?? battData["Inst"]
      const battName = `BAT${(instanceValue ?? 0) + 1}`

      if (!updatedMessages[battName]) {
        updatedMessages[battName] = []
      }

      const timeUS =
        gpsOffset !== null
          ? battData.TimeUS / 1000 + gpsOffset
          : battData.TimeUS

      updatedMessages[battName].push({
        ...battData,
        name: battName,
        TimeUS: timeUS,
      })

      if (!updatedFilters[battName]) {
        updatedFilters[battName] = { ...filterState["BAT"] }
      }

      if (!updatedFormats[battName]) {
        updatedFormats[battName] = {
          ...updatedFormats["BAT"],
          name: battName,
        }
      }
    })

    delete updatedMessages["BAT"]
    delete updatedFormats["BAT"]
    delete updatedFilters["BAT"]

    // Update logMessages["format"] too
    updatedMessages["format"] = updatedFormats

    return { updatedMessages, updatedFilters, updatedFormats }
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
    clearUnitCache() // Clear memoization cache
  }

  // Cache transformed data for each message type to avoid expensive re-processing
  const transformedData = useMemo(() => {
    if (!logMessages) return {}

    const cache = {}

    Object.keys(logMessages)
      .filter(
        (key) =>
          key !== "format" &&
          key !== "units" &&
          Array.isArray(logMessages[key]),
      )
      .forEach((categoryName) => {
        const messageData = logMessages[categoryName]
        cache[categoryName] = {}

        // Get available fields for this message type
        const fields = logMessages["format"]?.[categoryName]?.fields || []

        fields.forEach((fieldName) => {
          // Pre-transform data for each field
          cache[categoryName][fieldName] = messageData.map((d) => ({
            x: d.TimeUS,
            y: d[fieldName],
          }))
        })
      })

    return cache
  }, [logMessages])

  // Create base datasets when filters change
  const baseDatasets = useMemo(() => {
    if (!messageFilters || !transformedData) return []

    const datasets = Object.keys(messageFilters)
      .sort()
      .reduce((acc, categoryName) => {
        const category = messageFilters[categoryName]
        Object.keys(category)
          .sort()
          .forEach((fieldName) => {
            if (
              category[fieldName] &&
              transformedData[categoryName]?.[fieldName]
            ) {
              const label = `${categoryName}/${fieldName}`
              const unit = getUnit(
                categoryName,
                fieldName,
                formatMessages,
                units,
              )
              acc.push({
                label: label,
                yAxisID: unit,
                unit: unit,
                data: transformedData[categoryName][fieldName], // Use pre-cached data
              })
            }
          })
        return acc
      }, [])
    return datasets
  }, [messageFilters, transformedData, formatMessages, units])

  // Apply colors to datasets
  useEffect(() => {
    const datasetsWithColors = baseDatasets.map((dataset) => {
      const color = customColors[dataset.label] || "#000000"
      return {
        ...dataset,
        borderColor: color,
        backgroundColor: hexToRgba(color, 0.5),
      }
    })
    setLocalChartData({ datasets: datasetsWithColors })
  }, [baseDatasets, customColors])

  return (
    <Layout currentPage="fla">
      {logMessages === null ? (
        <SelectFlightLog processLoadedFile={processLoadedFile} />
      ) : (
        <MainDisplay closeLogFile={closeLogFile} chartData={chartData} />
      )}
    </Layout>
  )
}
