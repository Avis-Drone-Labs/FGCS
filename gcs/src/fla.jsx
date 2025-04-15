/*
  Falcon Log Analyser. This is a custom log analyser written to handle MavLink log files (.log) as well as FGCS telemetry log files (.ftlog).

  This allows users to toggle all messages on/off, look at preset message groups, save message groups, and follow the drone in 3D.
*/

// Base imports
import { Fragment, useEffect, useState } from "react"

// 3rd Party Imports
import {
  Accordion,
  Button,
  Divider,
  FileButton,
  LoadingOverlay,
  Progress,
  ScrollArea,
  Tooltip,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useSelector, useDispatch } from "react-redux"
import _ from "lodash"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config.js"

// Custom components and helpers
import moment from "moment"
import ChartDataCard from "./components/fla/chartDataCard.jsx"
import Graph from "./components/fla/graph"
import { dataflashOptions, fgcsOptions } from "./components/fla/graphConfigs.js"
import { logEventIds } from "./components/fla/logEventIds.js"
import MessageAccordionItem from "./components/fla/messageAccordionItem.jsx"
import PresetAccordionItem from "./components/fla/presetAccordionItem.jsx"
import { usePresetCategories } from "./components/fla/presetCategories.js"
import Layout from "./components/layout.jsx"
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
  setMessageFilters,
  setMessageMeans,
  setChartData,
  setCustomColors,
  setColorIndex,
  setAircraftType,
  setCanSavePreset,
} from "./redux/logAnalyserSlice.js"
import SavePresetModal from "./components/fla/savePresetModal.jsx"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Helper function to convert hex color to rgba
function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

const ignoredMessages = [
  "ERR",
  "EV",
  "MSG",
  "VER",
  "TIMESYNC",
  "PARAM_VALUE",
  "units",
  "format",
  "aircraftType",
]
const ignoredKeys = ["TimeUS", "function", "source", "result", "time_boot_ms"]
const colorPalette = [
  "#36a2eb",
  "#ff6383",
  "#fe9e40",
  "#4ade80",
  "#ffcd57",
  "#4cbfc0",
  "#9966ff",
  "#c8cbce",
]
const colorInputSwatch = [
  "#f5f5f5",
  "#868e96",
  "#fa5252",
  "#e64980",
  "#be4bdb",
  "#7950f2",
  "#4c6ef5",
  "#228be6",
  "#15aabf",
  "#12b886",
  "#40c057",
  "#82c91e",
  "#fab005",
  "#fd7e14",
]

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
  const {
    file,
    units,
    formatMessages,
    logMessages,
    logEvents,
    flightModeMessages,
    logType,
    messageFilters,
    messageMeans,
    chartData,
    customColors,
    colorIndex,
    aircraftType,
    canSavePreset,
  } = useSelector((state) => state.logAnalyser)

  // Local states
  const [recentFgcsLogs, setRecentFgcsLogs] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingFileProgress, setLoadingFileProgress] = useState(0)
  const [opened, { open, close }] = useDisclosure(false)

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
  const updateMessageFilters = (newMessageFilters) =>
    dispatch(setMessageFilters(newMessageFilters))
  const updateMessageMeans = (newMessageMeans) =>
    dispatch(setMessageMeans(newMessageMeans))
  const updateChartData = (newChartData) => dispatch(setChartData(newChartData))
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
    // If log messages have already been set from prev session, don't load again
    if (file != null && logMessages === null) {
      setLoadingFile(true)
      const result = await window.ipcRenderer.loadFile(file.path)

      if (result.success) {
        // Load messages into states
        setLoadingFile(false)
        const loadedLogMessages = result.messages

        if (loadedLogMessages === null) {
          showErrorNotification("Error loading file, no messages found.")
          return
        }

        updateLogType(result.logType)

        updateAircraftType(loadedLogMessages.aircraftType)

        delete loadedLogMessages.aircraftType // Remove aircraftType so it's not iterated upon later

        updateLogMessages(loadedLogMessages)

        if (result.logType === "dataflash") {
          updateFlightModeMessages(loadedLogMessages.MODE)
        } else if (result.logType === "fgcs_telemetry") {
          // Get the heartbeat messages only where index is the first or last or the mode changes
          const modeMessages = []
          for (let i = 0; i < loadedLogMessages.HEARTBEAT.length; i++) {
            const msg = loadedLogMessages.HEARTBEAT[i]
            if (
              modeMessages.length === 0 ||
              i === loadedLogMessages.HEARTBEAT.length - 1
            ) {
              modeMessages.push(msg)
            } else {
              const lastMsg = modeMessages[modeMessages.length - 1]
              if (lastMsg.custom_mode !== msg.custom_mode) {
                modeMessages.push(msg)
              }
            }
          }
          updateFlightModeMessages(modeMessages)
        }

        if ("units" in loadedLogMessages) {
          updateUnits(loadedLogMessages["units"])
        }

        if ("format" in loadedLogMessages) {
          updateFormatMessages(loadedLogMessages["format"])
        }

        // Set the default state to false for all message filters
        const logMessageFilterDefaultState = {}
        Object.keys(loadedLogMessages["format"])
          .sort()
          .forEach((key) => {
            if (
              Object.keys(loadedLogMessages).includes(key) &&
              !ignoredMessages.includes(key)
            ) {
              const fieldsState = {}

              // Set all field states to false if they're not ignored
              loadedLogMessages["format"][key].fields.map((field) => {
                if (!ignoredKeys.includes(field)) {
                  fieldsState[field] = false
                }
              })
              logMessageFilterDefaultState[key] = fieldsState
            }
          })

        if (loadedLogMessages["ESC"]) {
          // Load each ESC data into its own array
          loadedLogMessages["ESC"].map((escData) => {
            const newEscData = {
              ...escData,
              name: `ESC${escData["Instance"] + 1}`,
            }
            loadedLogMessages[newEscData.name] = (
              loadedLogMessages[newEscData.name] || []
            ).concat([newEscData])
            // Add filter state for new ESC
            if (!logMessageFilterDefaultState[newEscData.name])
              logMessageFilterDefaultState[newEscData.name] = {
                ...logMessageFilterDefaultState["ESC"],
              }
          })

          // Remove old ESC motor data
          delete loadedLogMessages["ESC"]
          delete logMessageFilterDefaultState["ESC"]
        }

        if (loadedLogMessages["BAT"]) {
          let tempLoadedLogMessages = { ...loadedLogMessages }
          let tempMsgFormat = { ...loadedLogMessages["format"] }

          // Load each BATT data into its own array
          loadedLogMessages["BAT"].map((battData) => {
            // Check for both "Inst" and "Instance" keys
            const instanceValue = battData["Instance"] ?? battData["Inst"]
            const battName = `BAT${(instanceValue ?? 0) + 1}`

            // Initialize the array if it doesn't exist
            if (!tempLoadedLogMessages[battName]) {
              tempLoadedLogMessages[battName] = []
            }

            tempLoadedLogMessages[battName].push({
              ...battData,
              name: battName,
            })

            // Add filter state for new BATT
            if (!logMessageFilterDefaultState[battName])
              logMessageFilterDefaultState[battName] = {
                ...logMessageFilterDefaultState["BAT"],
              }

            // Add format state for new BATT
            if (!tempMsgFormat[battName])
              tempMsgFormat[battName] = {
                ...tempMsgFormat["BAT"],
                name: battName,
              }

            tempLoadedLogMessages["format"] = tempMsgFormat
          })

          // Remove old BATT motor data
          delete tempLoadedLogMessages["BAT"]
          delete tempLoadedLogMessages["format"]["BAT"]
          delete logMessageFilterDefaultState["BAT"]
          updateLogMessages(tempLoadedLogMessages)
          updateFormatMessages(tempLoadedLogMessages["format"])
        }

        // Sort new filters
        const sortedLogMessageFilterState = Object.keys(
          logMessageFilterDefaultState,
        )
          .sort()
          .reduce((acc, c) => {
            acc[c] = logMessageFilterDefaultState[c]
            return acc
          }, {})

        updateMessageFilters(sortedLogMessageFilterState)
        calculateMeanValues(loadedLogMessages)

        // Set event logs for the event lines on graph
        if ("EV" in loadedLogMessages) {
          updateLogEvents(
            loadedLogMessages["EV"].map((event) => ({
              time: event.TimeUS,
              message: logEventIds[event.Id],
            })),
          )
        }

        // Close modal and show success message
        showSuccessNotification(`${file.name} loaded successfully`)
      } else {
        showErrorNotification("Error loading file, file not found. Reload.")
        setLoadingFile(false)
      }
    }
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
    updateChartData({ datasets: [] })
    updateMessageFilters(null)
    updateCustomColors({})
    updateColorIndex(0)
    updateLogEvents(null)
    updateLogType("dataflash")
    updateCanSavePreset(false)
  }

  // ====================================================
  // 3. Data Processing Functions
  // ====================================================

  function calculateMeanValues(loadedLogMessages) {
    // Loop over all fields and precalculate min, max, mean
    let rawValues = {}
    if (loadedLogMessages !== null) {
      // Putting all raw data into a list
      Object.keys(loadedLogMessages).forEach((key) => {
        if (!ignoredMessages.includes(key)) {
          let messageData = loadedLogMessages[key]
          let messageDataMeans = {}

          messageData.map((message) => {
            Object.keys(message).forEach((dataPointKey) => {
              let dataPoint = message[dataPointKey]
              if (dataPointKey != dataPoint && dataPointKey != "name") {
                if (messageDataMeans[dataPointKey] == undefined) {
                  messageDataMeans[dataPointKey] = [dataPoint]
                } else {
                  messageDataMeans[dataPointKey].push(dataPoint)
                }
              }
            })
          })

          rawValues[key] = messageDataMeans
        }
      })

      // Looping over each list and finding min, max, mean
      let means = {}
      Object.keys(rawValues).forEach((key) => {
        means[key] = {}
        let messageData = rawValues[key]
        Object.keys(messageData).forEach((messageKey) => {
          let messageValues = messageData[messageKey]
          let min = messageValues.reduce(
            (x, y) => Math.min(x, y),
            Number.NEGATIVE_INFINITY,
          )
          let max = messageValues.reduce(
            (x, y) => Math.max(x, y),
            Number.NEGATIVE_INFINITY,
          )
          let mean =
            messageValues.reduce((acc, curr) => acc + curr, 0) /
            messageValues.length

          means[`${key}/${messageKey}`] = {
            mean: mean.toFixed(2),
            max: max.toFixed(2),
            min: min.toFixed(2),
          }
        })
      })
      updateMessageMeans(means)
    }
  }

  // ====================================================
  // 4. Filter and Preset Management
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

    Object.keys(filter.filters).map((categoryName) => {
      if (Object.keys(messageFilters).includes(categoryName)) {
        filter.filters[categoryName].map((field) => {
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

          // Update the color index
          updateColorIndex(Object.keys(newColors).length)
        })
      } else {
        showErrorNotification(`Your log file does not include ${categoryName}`)
      }
    })

    // Update customColors with the newColors
    updateCustomColors(newColors)
    updateMessageFilters(newFilters)
    // Don't allow saving if we just selected an existing preset
    updateCanSavePreset(false)
  }

  function selectMessageFilter(event, messageName, fieldName) {
    let newFilters = _.cloneDeep(messageFilters)
    newFilters[messageName][fieldName] = event.currentTarget.checked

    // Create a deep copy of customColors
    let newColors = _.cloneDeep(customColors)

    // if unchecked remove custom color
    if (!newFilters[messageName][fieldName]) {
      delete newColors[`${messageName}/${fieldName}`]

      // Update customColors with the modified copy
      updateCustomColors(newColors)
    }
    // Else assign a color
    else {
      if (!newColors[`${messageName}/${fieldName}`]) {
        newColors[`${messageName}/${fieldName}`] =
          colorPalette[colorIndex % colorPalette.length]
        updateColorIndex((colorIndex + 1) % colorPalette.length)
      }

      // Update customColors with the modified copy
      updateCustomColors(newColors)
    }
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
  // 5. Color Management
  // ====================================================

  function changeColor(label, color) {
    let newColors = _.cloneDeep(customColors)
    newColors[label] = color
    updateCustomColors(newColors)
  }

  // ====================================================
  // 6. Utility Functions
  // ====================================================

  function getUnit(messageName, fieldName) {
    if (messageName.includes("ESC")) {
      messageName = "ESC"
    }

    if (messageName in formatMessages) {
      const formatMessage = formatMessages[messageName]
      const fieldIndex = formatMessage.fields.indexOf(fieldName)
      if (fieldIndex !== -1 && formatMessage.units) {
        const unitId = formatMessage.units[fieldIndex]
        if (unitId in units) {
          return units[unitId]
        }
      }
    }
    return "UNKNOWN"
  }

  // ====================================================
  // 7. Effect Hooks
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
              const unit = getUnit(categoryName, fieldName)
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

    updateChartData({ datasets: datasets })
  }, [messageFilters, customColors])

  // ======================================================
  // 8. Render
  // ======================================================

  return (
    <Layout currentPage="fla">
      {logMessages === null ? (
        // Open flight logs section
        <div className="flex flex-col items-center justify-center h-full mx-auto">
          <div className="flex flex-row items-center justify-center gap-8">
            <div className="flex flex-col gap-4">
              <FileButton
                color={tailwindColors.blue[600]}
                variant="filled"
                onChange={updateFile}
                accept={[".log", ".ftlog"]}
                loading={loadingFile}
              >
                {(props) => <Button {...props}>Analyse a log</Button>}
              </FileButton>
              <Button
                color={tailwindColors.red[600]}
                variant="filled"
                onClick={clearFgcsLogs}
              >
                Clear Logs
              </Button>
            </div>
            <Divider size="sm" orientation="vertical" />
            <div className="relative">
              <LoadingOverlay
                visible={recentFgcsLogs === null || loadingFile}
              />
              <div className="flex flex-col items-center gap-2">
                <p className="font-bold">Recent FGCS telemetry logs</p>
                <ScrollArea h={250} offsetScrollbars>
                  {recentFgcsLogs !== null &&
                    recentFgcsLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col px-4 py-2 hover:cursor-pointer hover:bg-falcongrey-700 hover:rounded-sm w-80"
                        onClick={() => updateFile(log)}
                      >
                        <p>{log.name} </p>
                        <div className="flex flex-row gap-2">
                          <p className="text-sm text-gray-400">
                            {moment(
                              log.timestamp.toISOString(),
                              "YYYY-MM-DD_HH-mm-ss",
                            ).fromNow()}
                          </p>
                          <p className="text-sm text-gray-400">
                            {Math.round(log.size / 1024)}KB
                          </p>
                        </div>
                      </div>
                    ))}
                </ScrollArea>
              </div>
            </div>
          </div>

          {loadingFile && (
            <Progress
              value={loadingFileProgress}
              className="w-full my-4"
              color={tailwindColors.green[500]}
            />
          )}
        </div>
      ) : (
        // Graphs section
        <>
          <div className="flex h-full gap-4 px-2 py-4 mb-4 overflow-y-auto overflow-x-hidden">
            {/* Message selection column */}
            <div className="w-1/4 pb-6">
              <div className="flex flex-col mb-2 text-sm gap-y-2">
                <div className="flex flex-row justify-between">
                  <Tooltip label={file.path}>
                    <div className="px-4 py-2 text-gray-200 bg-falcongrey-700 rounded truncate max-w-[400px] inline-block">
                      File Name:
                      <span
                        className="ml-2 text-white underline cursor-pointer"
                        onClick={() => {
                          window.ipcRenderer.send(
                            "openFileInExplorer",
                            file.path,
                          )
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </Tooltip>
                  <Button
                    className="ml-2"
                    size="sm"
                    color={tailwindColors.red[500]}
                    onClick={closeLogFile}
                  >
                    Close file
                  </Button>
                </div>
                <div className="flex justify-between px-4 py-2 text-gray-200 rounded bg-falcongrey-700">
                  <div className="whitespace-nowrap">Aircraft Type:</div>
                  <div className="text-white ml-auto truncate max-w-[200px]">
                    {aircraftType ? aircraftType : "No Aircraft Type"}
                  </div>
                </div>
              </div>

              <ScrollArea className="h-full max-h-[90%]">
                <Accordion multiple={true}>
                  {/* Presets */}
                  <Accordion.Item key="presets" value="presets">
                    <Accordion.Control className="rounded-md">
                      Presets
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Accordion multiple={true}>
                        {/* Custom Presets */}
                        {presetCategories["custom_" + logType]?.map(
                          (category) => {
                            return (
                              <Fragment key={category.name}>
                                <PresetAccordionItem
                                  key={category.name}
                                  category={category}
                                  selectPresetFunc={selectPreset}
                                  aircraftType={aircraftType}
                                  deleteCustomPreset={handleDeleteCustomPreset}
                                />
                              </Fragment>
                            )
                          },
                        )}
                        {/* Default Presets */}
                        {presetCategories[logType]?.map((category) => {
                          // Filter out presets with unavailable keys or fields
                          const filteredCategory = {
                            ...category,
                            filters: category.filters.filter((filter) =>
                              Object.keys(filter.filters).every((key) => {
                                // Check if the key exists in logMessages
                                if (!logMessages[key]) return false

                                // Check if the required fields exist in logMessages["format"][key].fields
                                const requiredFields = filter.filters[key]
                                const availableFields =
                                  logMessages["format"]?.[key]?.fields || []
                                return requiredFields.every((field) =>
                                  availableFields.includes(field),
                                )
                              }),
                            ),
                          }

                          // Skip categories with no valid filters
                          if (filteredCategory.filters.length === 0) {
                            return null
                          }

                          return (
                            <Fragment key={category.name}>
                              <PresetAccordionItem
                                key={category.name}
                                category={filteredCategory}
                                selectPresetFunc={selectPreset}
                                aircraftType={aircraftType}
                              />
                            </Fragment>
                          )
                        })}
                      </Accordion>
                    </Accordion.Panel>
                  </Accordion.Item>

                  {/* All messages */}
                  <Accordion.Item
                    key="messages"
                    value="messages"
                    styles={{ item: { borderBottom: "none" } }}
                  >
                    <Accordion.Control className="rounded-md">
                      Messages
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Accordion multiple={true}>
                        {Object.keys(messageFilters).map((messageName, idx) => {
                          return (
                            <Fragment key={idx}>
                              <MessageAccordionItem
                                key={idx}
                                messageName={messageName}
                                messageFilters={messageFilters}
                                selectMessageFilterFunc={selectMessageFilter}
                              />
                            </Fragment>
                          )
                        })}
                      </Accordion>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </ScrollArea>
            </div>

            {/* Graph column */}
            <div className="w-full h-full pr-4 min-w-0 flex flex-col">
              <Graph
                data={chartData}
                events={logEvents}
                flightModes={flightModeMessages}
                graphConfig={
                  logType === "dataflash" ? dataflashOptions : fgcsOptions
                }
                clearFilters={clearFilters}
                canSavePreset={canSavePreset}
                openPresetModal={open}
              />

              {/* Plots Setup */}
              <div className="grid grid-cols-5 gap-4 pt-4">
                {chartData.datasets.map((item) => (
                  <Fragment key={item.label}>
                    <ChartDataCard
                      item={item}
                      unit={getUnit(
                        item.label.split("/")[0],
                        item.label.split("/")[1],
                      )}
                      messageMeans={messageMeans}
                      colorInputSwatch={colorInputSwatch}
                      changeColorFunc={changeColor}
                      removeDatasetFunc={removeDataset}
                    />
                  </Fragment>
                ))}
              </div>

              <SavePresetModal
                opened={opened}
                close={close}
                onSave={handleSaveCustomPreset}
              />
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
