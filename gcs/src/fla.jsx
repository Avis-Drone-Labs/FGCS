/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { useSelector, useDispatch } from "react-redux"

// Styling imports
import {
  hexToRgba,
  getUnit,
  calcGPSOffset,
  convertTimeUStoUTC,
  processFlightModes,
  buildDefaultMessageFilters,
  calculateMeanValues,
  sortObjectByKeys,
} from "./components/fla/utils"

// Custom components and helpers
import { logEventIds } from "./components/fla/logEventIds.js"

import Layout from "./components/layout.jsx"
import SelectFlightLog from "./components/fla/SelectFlightLog.jsx"
import MainDisplay from "./components/fla/mainDisplay.jsx"
import {
  queueErrorNotification,
} from "./redux/slices/notificationSlice.js"
import {
  setFile,
  setUnits,
  setFormatMessages,
  setLogMessages,
  setLogEvents,
  setFlightModeMessages,
  setLogType,
  setUtcAvailable,
  setMessageFilters,
  setMessageMeans,
  setCustomColors,
  setColorIndex,
  setAircraftType,
  setCanSavePreset,

  // Selectors
  selectUnits,
  selectFormatMessages,
  selectLogMessages,
  selectMessageFilters,
  selectCustomColors,
} from "./redux/slices/logAnalyserSlice.js"

export default function FLA() {

  // Redux state
  const dispatch = useDispatch()
  const units = useSelector(selectUnits)
  const formatMessages = useSelector(selectFormatMessages)
  const logMessages = useSelector(selectLogMessages)
  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)

  // Local states
  const [chartData, setLocalChartData] = useState({ datasets: [] })

  // Redux dispatch functions
  const updateFile = (newFile) => dispatch(setFile(newFile))
  const updateUnits = (newUnits) => dispatch(setUnits(newUnits))
  const updateFormatMessages = (newFormatMessages) =>
    dispatch(setFormatMessages(newFormatMessages))
  const updateLogMessages = (newLogMessages) =>
    dispatch(setLogMessages(newLogMessages))
  const updateLogEvents = (newLogEvents) => dispatch(setLogEvents(newLogEvents))
  const updateFlightModeMessages = (newFlightModeMessages) =>
    dispatch(setFlightModeMessages(newFlightModeMessages))
  const updateLogType = (newLogType) => dispatch(setLogType(newLogType))
  const updateUtcAvailable = (newUtcAvailable) =>
    dispatch(setUtcAvailable(newUtcAvailable))
  const updateMessageFilters = (newMessageFilters) =>
    dispatch(setMessageFilters(newMessageFilters))
  const updateMessageMeans = (newMessageMeans) =>
    dispatch(setMessageMeans(newMessageMeans))
  const updateCustomColors = (newCustomColors) =>
    dispatch(setCustomColors(newCustomColors))
  const updateColorIndex = (newColorIndex) =>
    dispatch(setColorIndex(newColorIndex))
  const updateAircraftType = (newAircraftType) =>
    dispatch(setAircraftType(newAircraftType))
  const updateCanSavePreset = (newCanSavePreset) =>
    dispatch(setCanSavePreset(newCanSavePreset))
  const dispatchErrorNotification = (message) =>
    dispatch(queueErrorNotification(message))

  // ====================================================
  // 2. File Management Functions
  // ====================================================

  async function processLoadedFile(result) {
    const loadedLogMessages = result.messages

    if (!loadedLogMessages) {
      dispatchErrorNotification("Error loading file, no messages found.")
      return
    }

    // 1. Update log and aircraft type
    updateLogType(result.logType)
    updateAircraftType(loadedLogMessages.aircraftType)
    delete loadedLogMessages.aircraftType
    updateLogMessages(loadedLogMessages)

    // 2. Update format and units
    if ("units" in loadedLogMessages) updateUnits(loadedLogMessages["units"])
    if ("format" in loadedLogMessages)
      updateFormatMessages(loadedLogMessages["format"])

    // 3. Process flight modes and set UTC availability
    const flightModeMessages = processFlightModes(result, loadedLogMessages)
    updateFlightModeMessages(flightModeMessages)
    if (result.logType === "fgcs_telemetry") updateUtcAvailable(true)

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
        updateUtcAvailable(true)
        updateFlightModeMessages(tempLoadedLogMessages.MODE)
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
    updateLogMessages(finalMessages)
    updateFormatMessages(updatedFormats)
    updateMessageFilters(sortObjectByKeys(finalFilters))

    // 9. Calculate and set means and set event logs for the event lines on graph
    const means = calculateMeanValues(loadedLogMessages)
    updateMessageMeans(means)
    if ("EV" in loadedLogMessages) {
      updateLogEvents(
        loadedLogMessages["EV"].map((event) => ({
          time:
            gpsOffset !== null ? event.TimeUS / 1000 + gpsOffset : event.TimeUS,
          message: logEventIds[event.Id],
        })),
      )
    }
  }

  /**
   * Expands ESC messages into separate arrays based on Instance
   */
  function expandESCMessages(logMessages, filterState) {
    if (!logMessages["ESC"]) {
      return { updatedMessages: logMessages, updatedFilters: filterState }
    }

    const updatedMessages = { ...logMessages }
    const updatedFilters = { ...filterState }

    logMessages["ESC"].forEach((escData) => {
      const newEscData = {
        ...escData,
        name: `ESC${escData["Instance"] + 1}`,
      }
      updatedMessages[newEscData.name] = (
        updatedMessages[newEscData.name] || []
      ).concat([newEscData])

      if (!updatedFilters[newEscData.name]) {
        updatedFilters[newEscData.name] = { ...filterState["ESC"] }
      }
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

    return { updatedMessages, updatedFilters, updatedFormats }
  }

  // Close file
  function closeLogFile() {
    updateFile(null)
    updateLogMessages(null)
    setLocalChartData({ datasets: [] })
    updateMessageFilters(null)
    updateCustomColors({})
    updateUtcAvailable(false)
    updateColorIndex(0)
    updateLogEvents(null)
    updateLogType("dataflash")
    updateCanSavePreset(false)
  }

  // Update datasets based on the message filters constantly
  useEffect(() => {
    if (!messageFilters || !logMessages) return
    // Sort the category and field names to maintain consistent order
    const datasets = Object.keys(messageFilters)
      .sort()
      .reduce((acc, categoryName) => {
        const category = messageFilters[categoryName]
        Object.keys(category)
          .sort()
          .forEach((fieldName) => {
            if (category[fieldName]) {
              const label = `${categoryName}/${fieldName}`
              const color = customColors[label]
              const unit = getUnit(
                categoryName,
                fieldName,
                formatMessages,
                units,
              )
              acc.push({
                label: label,
                yAxisID: unit,
                data: logMessages[categoryName].map((d) => ({
                  x: d.TimeUS,
                  y: d[fieldName],
                })),
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.5), // Use a more transparent shade for the background
              })
            }
          })
        return acc
      }, [])

    setLocalChartData({ datasets: datasets })
  }, [messageFilters, customColors])

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
