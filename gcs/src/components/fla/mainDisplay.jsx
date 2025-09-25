import { Accordion, Button, ScrollArea, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Fragment } from "react"
import { useSelector } from "react-redux"
import {
  selectAircraftType,
  selectFile,
  selectFormatMessages,
  selectMessageMeans,
  selectUnits,
} from "../../redux/slices/logAnalyserSlice.js"
import ChartDataCard from "./chartDataCard.jsx"
import Graph from "./graph.jsx"
import MessagesFiltersAccordion from "./messagesFiltersAccordion.jsx"
import { usePresetCategories } from "./presetCategories.js"
import PresetsAccordion from "./presetsAccordion.jsx"
import SavePresetModal from "./savePresetModal.jsx"
import { getUnit } from "./utils.js"

/**
 * Main display component for the Falcon Log Analyser (FLA).
 */
export default function MainDisplay({ closeLogFile, chartData }) {
  // Redux selectors
  const file = useSelector(selectFile)
  const aircraftType = useSelector(selectAircraftType)
  const messageMeans = useSelector(selectMessageMeans)
  const formatMessages = useSelector(selectFormatMessages)
  const units = useSelector(selectUnits)

  // Shared presets state for all children (presets + modal)
  const {
    presetCategories,
    saveCustomPreset,
    deleteCustomPreset,
    findExistingPreset,
  } = usePresetCategories()

  const [
    isSavePresetModalOpen,
    { open: openSavePresetModal, close: closeSavePresetModal },
  ] = useDisclosure(false)

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
              {aircraftType ?? "No Aircraft Type"}
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
                <PresetsAccordion
                  presetCategories={presetCategories}
                  deleteCustomPreset={deleteCustomPreset}
                />
              </Accordion.Panel>
            </Accordion.Item>

            {/* All messages (checkboxes in accordions) */}
            <Accordion.Item
              key="messages"
              value="messages"
              styles={{ item: { borderBottom: "none" } }}
            >
              <Accordion.Control className="rounded-md">
                Messages
              </Accordion.Control>
              <Accordion.Panel>
                <MessagesFiltersAccordion />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </ScrollArea>
      </div>
      {/* Graph column */}
      <div className="w-full h-full pr-4 min-w-0 flex flex-col">
        <Graph data={chartData} openPresetModal={openSavePresetModal} />
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
              />
            </Fragment>
          ))}
        </div>
        <SavePresetModal
          isSavePresetModalOpen={isSavePresetModalOpen}
          closeSavePresetModal={closeSavePresetModal}
          saveCustomPreset={saveCustomPreset}
          findExistingPreset={findExistingPreset}
        />
      </div>
    </div>
  )
}
