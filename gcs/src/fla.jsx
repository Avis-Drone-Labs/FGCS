/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { useDispatch, useSelector } from "react-redux"

// Styling imports
import {
  buildDefaultMessageFilters,
  calcGPSOffset,
  calculateMeanValues,
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
