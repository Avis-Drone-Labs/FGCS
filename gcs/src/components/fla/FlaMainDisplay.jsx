import { Fragment } from "react"
import { Button, Tooltip, ScrollArea, Accordion } from "@mantine/core"
import Graph from "./graph"
import ChartDataCard from "./chartDataCard"
import SavePresetModal from "./savePresetModal"
import PresetAccordionItem from "./presetAccordionItem"
import MessageAccordionItem from "./messageAccordionItem"
import { getUnit } from "./utils"
import { colorInputSwatch } from "./constants"
import { useSelector } from "react-redux"
import { dataflashOptions, fgcsOptions } from "./graphConfigs.js"
import {
  selectFile,
  selectAircraftType,
  selectLogType,
  selectMessageFilters,
  selectLogEvents,
  selectFlightModeMessages,
  selectUtcAvailable,
  selectCanSavePreset,
  selectMessageMeans,
  selectFormatMessages,
  selectUnits,
} from "../../redux/slices/logAnalyserSlice"

/**
 * Main display component for the Falcon Log Analyser (FLA).
 */
export default function FlaMainDisplay({
  closeLogFile,
  presetCategories,
  selectPreset,
  handleDeleteCustomPreset,
  selectMessageFilter,
  chartData,
  clearFilters,
  open,
  changeColor,
  removeDataset,
  opened,
  close,
  handleSaveCustomPreset,
  filteredDefaultPresets,
}) {

  // Redux selectors
  const file = useSelector(selectFile)
  const aircraftType = useSelector(selectAircraftType)
  const logType = useSelector(selectLogType)
  const messageFilters = useSelector(selectMessageFilters)
  const logEvents = useSelector(selectLogEvents)
  const flightModeMessages = useSelector(selectFlightModeMessages)
  const utcAvailable = useSelector(selectUtcAvailable)
  const canSavePreset = useSelector(selectCanSavePreset)
  const messageMeans = useSelector(selectMessageMeans)
  const formatMessages = useSelector(selectFormatMessages)
  const units = useSelector(selectUnits)

  return (
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
                    window.ipcRenderer.send("openFileInExplorer", file.path)
                  }}
                >
                  {file.name}
                </span>
              </div>
            </Tooltip>
            <Button
              className="ml-2"
              size="sm"
              color="red"
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
                  {presetCategories["custom_" + logType]?.map((category) => (
                    <Fragment key={category.name}>
                      <PresetAccordionItem
                        key={category.name}
                        category={category}
                        selectPresetFunc={selectPreset}
                        aircraftType={aircraftType}
                        deleteCustomPreset={handleDeleteCustomPreset}
                      />
                    </Fragment>
                  ))}
                  {/* Default Presets */}
                  {filteredDefaultPresets.map((category) => (
                    <Fragment key={category.name}>
                      <PresetAccordionItem
                        key={category.name}
                        category={category}
                        selectPresetFunc={selectPreset}
                        aircraftType={aircraftType}
                      />
                    </Fragment>
                  ))}
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
                  {Object.keys(messageFilters).map((messageName, idx) => (
                    <Fragment key={idx}>
                      <MessageAccordionItem
                        key={idx}
                        messageName={messageName}
                        messageFilters={messageFilters}
                        selectMessageFilterFunc={selectMessageFilter}
                      />
                    </Fragment>
                  ))}
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
          graphConfig={utcAvailable ? fgcsOptions : dataflashOptions}
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
                  formatMessages,
                  units,
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
  )
}
