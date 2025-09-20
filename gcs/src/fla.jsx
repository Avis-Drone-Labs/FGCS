/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { useEffect, useState, useMemo } from "react"

// 3rd Party Imports
import { useDisclosure } from "@mantine/hooks"
import { useSelector, useDispatch } from "react-redux"
import _ from "lodash"

// Styling imports
import { colorPalette } from "./components/fla/constants"
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
import { usePresetCategories } from "./components/fla/presetCategories.js"
import Layout from "./components/layout.jsx"
import SelectFlightLog from "./components/fla/SelectFlightLog.jsx"
import FlaMainDisplay from "./components/fla/FlaMainDisplay.jsx"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification.js"
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
  selectFile,
  selectUnits,
  selectFormatMessages,
  selectLogMessages,
  selectLogType,
  selectMessageFilters,
  selectCustomColors,
  selectColorIndex,
  selectAircraftType,
} from "./redux/slices/logAnalyserSlice.js"

export default function FLA() {
  // ====================================================
  // 1. Custom Hooks and State Management
  // ====================================================

  const {
    presetCategories,
    saveCustomPreset,
    deleteCustomPreset,
    findExistingPreset,
  } = usePresetCategories()

  // Redux state
  const dispatch = useDispatch()
  const file = useSelector(selectFile)
  const units = useSelector(selectUnits)
  const formatMessages = useSelector(selectFormatMessages)
  const logMessages = useSelector(selectLogMessages)
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)
  const customColors = useSelector(selectCustomColors)
  const colorIndex = useSelector(selectColorIndex)
  const aircraftType = useSelector(selectAircraftType)

  // Local states
  const [recentFgcsLogs, setRecentFgcsLogs] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingFileProgress, setLoadingFileProgress] = useState(0)
  const [opened, { open, close }] = useDisclosure(false)
  const [chartData, setLocalChartData] = useState({ datasets: [] })
  // use memo such that this is calculated only when necessary
  const filteredDefaultPresets = useMemo(() => {
    if (!presetCategories || !logType || !logMessages) {
      return []
    }
    return (
      presetCategories[logType]
        ?.map((category) => {
          // Filter out presets with unavailable keys or fields
          const filteredCategory = {
            ...category,
            filters: category.filters.filter((filter) =>
              Object.keys(filter.filters).every((key) => {
                // Check if the key exists in logMessages
                if (!logMessages[key]) return false
                const requiredFields = filter.filters[key]
                const availableFields =
                  logMessages["format"]?.[key]?.fields || []
                return requiredFields.every((field) =>
                  availableFields.includes(field),
                )
              }),
            ),
          }
          return filteredCategory
        })
        .filter((category) => category.filters.length > 0) || []
    )
  }, [presetCategories, logType, logMessages])

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

  // ====================================================
  // 2. File Management Functions
  // ====================================================

  async function loadFile() {
    // Early return if conditions not met
    if (file === null || logMessages !== null) return

    try {
      setLoadingFile(true)
      const result = await window.ipcRenderer.loadFile(file.path)

      if (!result.success) {
        showErrorNotification("Error loading file, file not found. Reload.")
        return
      }

      await processLoadedFile(result)
      showSuccessNotification(`${file.name} loaded successfully`)
    } catch (error) {
      showErrorNotification("Error loading file: " + error.message)
    } finally {
      setLoadingFile(false)
    }
  }

  async function processLoadedFile(result) {
    const loadedLogMessages = result.messages

    if (!loadedLogMessages) {
      showErrorNotification("Error loading file, no messages found.")
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
          time:  gpsOffset !== null ? (event.TimeUS / 1000 + gpsOffset) : event.TimeUS,
          message: logEventIds[event.Id],
        })),
      )
    }
  }

  /**
   * Expands ESC messages into separate arrays based on Instance
   * @param {Object} logMessages - Messages to expand
   * @param {Object} filterState - Filter state to update
   * @returns {Object} { updatedMessages, updatedFilters }
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
   * @param {Object} logMessages - Original messages
   * @param {Object} tempMessages - Time-converted messages
   * @param {Object} filterState - Filter state to update
   * @param {number|null} gpsOffset - GPS offset for time conversion
   * @returns {Object} { updatedMessages, updatedFilters, updatedFormats }
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

  // Get a list of the recent FGCS telemetry logs
  async function getFgcsLogs() {
    setRecentFgcsLogs(await window.ipcRenderer.getRecentLogs())
  }

  // Clear the list of recent FGCS telemetry logs
  async function clearFgcsLogs() {
    await window.ipcRenderer.clearRecentLogs()
    getFgcsLogs()
  }

  // Close file
  function closeLogFile() {
    setLoadingFileProgress(0)
    resetState()
    getFgcsLogs()
  }

  function resetState() {
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

  // ====================================================
  // 3. Filter and Preset Management
  // ====================================================

  // Turn on/off all filters
  function clearFilters() {
    let newFilters = _.cloneDeep(messageFilters)
    Object.keys(newFilters).forEach((categoryName) => {
      const category = newFilters[categoryName]
      Object.keys(category).forEach((fieldName) => {
        newFilters[categoryName][fieldName] = false
      })
    })
    updateMessageFilters(newFilters)
    updateCustomColors({})
    updateColorIndex(0)
    updateCanSavePreset(false)
  }

  // Turn off only one filter at a time
  function removeDataset(label) {
    let [categoryName, fieldName] = label.split("/")
    let newFilters = _.cloneDeep(messageFilters)
    if (
      newFilters[categoryName] &&
      newFilters[categoryName][fieldName] !== undefined
    ) {
      newFilters[categoryName][fieldName] = false
    }
    let newColors = _.cloneDeep(customColors)
    delete newColors[label]
    updateCustomColors(newColors)
    updateMessageFilters(newFilters)
    if (Object.keys(newColors).length === 0) {
      updateCanSavePreset(false)
    } else {
      updateCanSavePreset(true)
    }
  }

  // Preset selection
  function selectPreset(filter) {
    let newFilters = _.cloneDeep(messageFilters)
    Object.keys(newFilters).forEach((categoryName) => {
      const category = newFilters[categoryName]
      Object.keys(category).forEach((fieldName) => {
        newFilters[categoryName][fieldName] = false
      })
    })

    let newColors = {}

    Object.keys(filter.filters).forEach((categoryName) => {
      if (Object.keys(messageFilters).includes(categoryName)) {
        filter.filters[categoryName].forEach((field) => {
          if (!(field in messageFilters[categoryName])) {
            showErrorNotification(
              `Your log file does not include ${categoryName}/${field} data`,
            )
            return
          }
          newFilters[categoryName][field] = true

          // Assign a color
          if (!newColors[`${categoryName}/${field}`]) {
            newColors[`${categoryName}/${field}`] =
              colorPalette[Object.keys(newColors).length % colorPalette.length]
          }
        })
      } else {
        showErrorNotification(`Your log file does not include ${categoryName}`)
      }
    })

    updateColorIndex(Object.keys(newColors).length % colorPalette.length) // limited by palette length
    updateCustomColors(newColors)
    updateMessageFilters(newFilters)
    // Don't allow saving if we just selected an existing preset
    updateCanSavePreset(false)
  }

  function selectMessageFilter(event, messageName, fieldName) {
    let newFilters = _.cloneDeep(messageFilters)
    let newColors = _.cloneDeep(customColors)

    const checked = event.currentTarget.checked
    newFilters[messageName][fieldName] = checked

    if (!checked) {
      delete newColors[`${messageName}/${fieldName}`]
    } else {
      if (!newColors[`${messageName}/${fieldName}`]) {
        newColors[`${messageName}/${fieldName}`] =
          colorPalette[colorIndex % colorPalette.length]
        updateColorIndex((colorIndex + 1) % colorPalette.length)
      }
    }

    updateCustomColors(newColors)
    updateMessageFilters(newFilters)

    // Then check if we should allow saving preset
    // Only enable save if there are selected filters
    const hasSelectedFilters = Object.values(newFilters).some((category) =>
      Object.values(category).some((isSelected) => isSelected),
    )
    updateCanSavePreset(hasSelectedFilters)
  }

  // Function to handle saving a custom preset
  function handleSaveCustomPreset(presetName) {
    if (!presetName) return

    if (presetName) {
      const currentFilters = Object.entries(messageFilters).reduce(
        (acc, [category, fields]) => {
          acc[category] = Object.keys(fields).filter((field) => fields[field])
          return acc
        },
        {},
      )

      const newPreset = {
        name: presetName,
        filters: currentFilters,
        aircraftType: aircraftType ? [aircraftType] : undefined, // Only save the aircraft type if it exists
      }

      const existingPreset = findExistingPreset(newPreset, logType)

      if (!existingPreset) {
        saveCustomPreset(newPreset, logType)
        showSuccessNotification(
          `Custom preset "${presetName}" saved successfully`,
        )
        close()
        updateCanSavePreset(false)
      } else {
        if (existingPreset.name === presetName) {
          showErrorNotification(
            `The name "${presetName}" is in use. Please choose a different name.`,
          )
        } else {
          showErrorNotification(
            `Custom preset "${presetName}" already exists as "${existingPreset.name}".`,
          )
          close()
          updateCanSavePreset(false)
        }
      }
    }
  }

  function handleDeleteCustomPreset(presetName) {
    // Are there filters on screen?
    const hasSelectedFilters = Object.values(messageFilters).some((category) =>
      Object.values(category).some((isSelected) => isSelected),
    )

    // If so, check if they match the filters of the preset to be deleted
    if (hasSelectedFilters) {
      const filtersOfPresetToBeDeleted = presetCategories[
        "custom_" + logType
      ][0].filters.find((filter) => filter.name === presetName).filters

      const activeMessageFields = Object.entries(messageFilters).reduce(
        (filteredCategories, [categoryName, fields]) => {
          filteredCategories[categoryName] = Object.keys(fields).filter(
            (fieldName) => fields[fieldName],
          )
          return filteredCategories
        },
        {},
      )
      const matchesSelectedPresets = _.isEqual(
        filtersOfPresetToBeDeleted,
        activeMessageFields,
      )

      if (matchesSelectedPresets) {
        updateCanSavePreset(true)
      }
    }

    deleteCustomPreset(presetName, logType)
    showSuccessNotification(
      `Custom preset "${presetName}" deleted successfully`,
    )
  }

  // ====================================================
  // 4. Color Management
  // ====================================================

  function changeColor(label, color) {
    let newColors = _.cloneDeep(customColors)
    newColors[label] = color
    updateCustomColors(newColors)
  }

  // ====================================================
  // 5. Effect Hooks
  // ====================================================

  // Ensure file is loaded when selected
  useEffect(() => {
    if (file !== null) {
      loadFile()
    }
  }, [file])

  // Set IPC renderer for log messages
  useEffect(() => {
    window.ipcRenderer.on("fla:log-parse-progress", function (evt, message) {
      setLoadingFileProgress(message.percent)
    })
    getFgcsLogs()

    return () => {
      window.ipcRenderer.removeAllListeners(["fla:log-parse-progress"])
    }
  }, [])

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

  // ======================================================
  // 6. Render
  // ======================================================

  return (
    <Layout currentPage="fla">
      {logMessages === null ? (
        <SelectFlightLog
          recentFgcsLogs={recentFgcsLogs}
          loadingFile={loadingFile}
          loadingFileProgress={loadingFileProgress}
          updateFile={updateFile}
          clearFgcsLogs={clearFgcsLogs}
        />
      ) : (
        <FlaMainDisplay
          closeLogFile={closeLogFile}
          presetCategories={presetCategories}
          selectPreset={selectPreset}
          handleDeleteCustomPreset={handleDeleteCustomPreset}
          selectMessageFilter={selectMessageFilter}
          chartData={chartData}
          clearFilters={clearFilters}
          open={open}
          changeColor={changeColor}
          removeDataset={removeDataset}
          opened={opened}
          close={close}
          handleSaveCustomPreset={handleSaveCustomPreset}
          filteredDefaultPresets={filteredDefaultPresets}
        />
      )}
    </Layout>
  )
}
