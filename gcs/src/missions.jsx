/*
  The missions screen.
*/

// Base imports
import { useEffect, useRef, useState } from "react"

// 3rd Party Imports
import { useSessionStorage } from "@mantine/hooks"
import { ResizableBox } from "react-resizable"
import { v4 as uuidv4 } from "uuid"

// Custom component and helpers
import {
  ActionIcon,
  Button,
  Divider,
  FileButton,
  Modal,
  Progress,
  Tabs,
  Tooltip,
} from "@mantine/core"
import { IconInfoCircle, IconX } from "@tabler/icons-react"
import Layout from "./components/layout"
import FenceItemsTable from "./components/missions/fenceItemsTable"
import MissionItemsTable from "./components/missions/missionItemsTable"
import MissionStatistics from "./components/missions/missionStatistics"
import MissionsMapSection from "./components/missions/missionsMap"
import RallyItemsTable from "./components/missions/rallyItemsTable"
import NoDroneConnected from "./components/noDroneConnected"
import { intToCoord } from "./helpers/dataFormatters"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetHomePosition,
  selectConnectedToDrone,
} from "./redux/slices/droneConnectionSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"
import {
  emitExportMissionToFile,
  emitGetCurrentMission,
  emitGetTargetInfo,
  emitImportMissionFromFile,
  emitWriteCurrentMission,
  getFrameKey,
  selectActiveTab,
  selectDrawingFenceItems,
  selectDrawingMissionItems,
  selectDrawingRallyItems,
  selectHomePosition,
  selectMissionProgressData,
  selectMissionProgressModal,
  selectTargetInfo,
  selectUnwrittenChanges,
  setActiveTab,
  setMissionProgressData,
  setMissionProgressModal,
} from "./redux/slices/missionSlice"
import { queueErrorNotification } from "./redux/slices/notificationSlice"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const coordsFractionDigits = 7
const resizeTableHeightPadding = 20 // To account for the handle height and some padding

function UnwrittenChangesWarning({ unwrittenChanges }) {
  const firstUnwrittenTab = Object.entries(unwrittenChanges).find(
    ([, changed]) => changed,
  )

  return (
    <>
      {firstUnwrittenTab && (
        <p className="text-red-400 text-center">
          You have unwritten <b>{firstUnwrittenTab[0]}</b> changes.
        </p>
      )}
    </>
  )
}

export default function Missions() {
  // Redux
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const targetInfo = useSelector(selectTargetInfo)
  const homePosition = useSelector(selectHomePosition)
  const activeTab = useSelector(selectActiveTab)

  // Mission items
  const missionItems = useSelector(selectDrawingMissionItems)
  const fenceItems = useSelector(selectDrawingFenceItems)
  const rallyItems = useSelector(selectDrawingRallyItems)
  const unwrittenChanges = useSelector(selectUnwrittenChanges)
  const missionProgressModalOpened = useSelector(selectMissionProgressModal)
  const missionProgressModalData = useSelector(selectMissionProgressData)

  // Other states
  const [showWarningBanner, setShowWarningBanner] = useSessionStorage({
    key: "showWarningBanner",
    defaultValue: true,
  })

  // Need to keep a reference to the active tab to avoid stale closures
  const activeTabRef = useRef(activeTab)
  const tabsListRef = useRef(null)
  const [tableSectionHeight, setTableSectionHeight] = useState(300)

  // File import handling
  const [importFile, setImportFile] = useState(null)
  const importFileResetRef = useRef(null)

  // Modal for mission progress
  const [missionProgressModalTitle, setMissionProgressModalTitle] = useState(
    "Mission progress update",
  )
  const [currentPage] = useSessionStorage({ key: "currentPage" })
  const mapRef = useRef()

  useEffect(() => {
    if (tabsListRef.current) {
      // Set initial height of the table section when component mounts
      setTableSectionHeight(
        300 - tabsListRef.current.clientHeight - resizeTableHeightPadding,
      )
    }
  }, [tabsListRef.current])

  // Send some messages when file is loaded
  useEffect(() => {
    dispatch(emitGetHomePosition())
    dispatch(emitGetTargetInfo())
  }, [currentPage])

  useEffect(() => {
    if (importFile) {
      importMissionFromFile(importFile.path)
    }
  }, [importFile])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  function resetMissionProgressModalData() {
    dispatch(
      setMissionProgressData({
        message: "",
        progress: null,
      }),
    )
  }

  function createHomePositionItem() {
    if (!homePosition) {
      dispatch(queueErrorNotification("Home position is not set"))
      return
    }

    const newHomeItem = {
      id: uuidv4(),
      seq: 0, // Home position is always the first item
      x: homePosition.lat,
      y: homePosition.lon,
      z: homePosition.alt || 0,
      frame: getFrameKey("MAV_FRAME_GLOBAL"),
      command: 16, // MAV_CMD_NAV_WAYPOINT
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      current: 1, // Set as current waypoint
      autocontinue: 1,
      target_component: targetInfo.target_component,
      target_system: targetInfo.target_system,
      mission_type:
        activeTabRef.current === "mission"
          ? 0
          : activeTabRef.current === "fence"
            ? 1
            : activeTabRef.current === "rally"
              ? 2
              : 0, // Default to 0 (Mission type) if activeTab is unrecognized,
      mavpackettype: "MISSION_ITEM_INT",
    }

    return newHomeItem
  }

  function readMissionFromDrone() {
    dispatch(emitGetCurrentMission())
    setMissionProgressModalTitle(`Reading ${activeTabRef.current} from drone`)
    resetMissionProgressModalData()
    dispatch(setMissionProgressModal(true))
  }

  function writeMissionToDrone() {
    if (activeTabRef.current === "mission") {
      dispatch(
        emitWriteCurrentMission({ type: "mission", items: missionItems }),
      )
    } else if (activeTabRef.current === "fence") {
      dispatch(emitWriteCurrentMission({ type: "fence", items: fenceItems }))
    } else if (activeTabRef.current === "rally") {
      dispatch(emitWriteCurrentMission({ type: "rally", items: rallyItems }))
    }
    setMissionProgressModalTitle(`Writing ${activeTabRef.current} to drone`)
    resetMissionProgressModalData()
    dispatch(setMissionProgressModal(true))
  }

  function importMissionFromFile(filePath) {
    dispatch(
      emitImportMissionFromFile({
        type: activeTabRef.current,
        file_path: filePath,
      }),
    )

    // Reset the import file after sending
    setImportFile(null)
    importFileResetRef.current?.()
  }

  async function saveMissionToFile() {
    // The options for the save dialog
    const options = {
      title: "Save the mission to a file",
      filters: [
        { name: "Waypoint Files", extensions: ["waypoints"] },
        { name: "All Files", extensions: ["*"] },
      ],
    }

    const result = await window.ipcRenderer.getSaveMissionFilePath(options)

    if (!result.canceled) {
      let items = []
      if (activeTabRef.current === "mission") {
        items = [...missionItems]
      } else if (activeTabRef.current === "fence") {
        items = [...fenceItems]

        const newHomeItem = createHomePositionItem()
        if (newHomeItem) {
          items.unshift(newHomeItem) // Add home item at the beginning
        }

        // Ensure all sequence values are updated
        items = items.map((item, index) => ({
          ...item,
          seq: index,
        }))
      } else if (activeTabRef.current === "rally") {
        items = [...rallyItems]

        const newHomeItem = createHomePositionItem()
        if (newHomeItem) {
          items.unshift(newHomeItem) // Add home item at the beginning
        }

        // Ensure all sequence values are updated
        items = items.map((item, index) => ({
          ...item,
          seq: index,
        }))
      }

      dispatch(
        emitExportMissionToFile({
          type: activeTabRef.current,
          file_path: result.filePath,
          items: items,
        }),
      )
    }
  }

  return (
    <Layout currentPage="missions">
      <Modal
        opened={missionProgressModalOpened}
        onClose={() => dispatch(setMissionProgressModal(false))}
        title={missionProgressModalTitle}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div className="flex flex-col items-center justify-center mt-4">
          {missionProgressModalData.message && (
            <p className="text-center mb-2">
              {missionProgressModalData.message}
            </p>
          )}

          {missionProgressModalData.progress !== null &&
            missionProgressModalData.progress !== undefined && (
              <Progress
                color="lime"
                animated
                size="lg"
                transitionDuration={300}
                value={missionProgressModalData.progress * 100}
                className="w-full mx-auto my-auto"
              />
            )}
        </div>
      </Modal>

      {/* Banner to let people know that things are still under development */}
      {showWarningBanner && (
        <div className="bg-falconred-700 flex flex-row items-center justify-between w-full">
          <p className="text-white text-center flex-1">
            Missions is still under development so some features are still
            missing. If you find any bugs please report them to us.
          </p>
          <ActionIcon
            onClick={() => setShowWarningBanner(false)}
            variant="transparent"
            className="mr-2"
          >
            <IconX color="white" />
          </ActionIcon>
        </div>
      )}

      {connected ? (
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Resizable Sidebar */}
            <ResizableBox
              width={200}
              height={Infinity}
              minConstraints={[200, Infinity]}
              maxConstraints={[600, Infinity]}
              resizeHandles={["e"]}
              axis="x"
              handle={
                <div className="w-2 h-full bg-falcongrey-900 hover:bg-falconred-500 cursor-col-resize absolute right-0 top-0 z-10"></div>
              }
              className="relative bg-falcongrey-800 overflow-y-auto"
            >
              <div className="flex flex-col gap-8 p-4">
                <div className="flex flex-col gap-4">
                  <UnwrittenChangesWarning
                    unwrittenChanges={unwrittenChanges}
                  />

                  <Button
                    onClick={() => {
                      readMissionFromDrone()
                    }}
                    disabled={!connected}
                    className="grow"
                  >
                    Read {activeTab}
                  </Button>
                  <Button
                    onClick={() => {
                      writeMissionToDrone()
                    }}
                    disabled={!connected}
                    className="grow"
                  >
                    Write {activeTab}
                  </Button>
                </div>

                <Divider className="my-1" />

                <div className="flex flex-col gap-4">
                  <FileButton
                    resetRef={importFileResetRef}
                    onChange={setImportFile}
                    accept=".waypoints,.txt"
                    className="grow"
                  >
                    {(props) => <Button {...props}>Import from file</Button>}
                  </FileButton>
                  <Button
                    onClick={() => {
                      saveMissionToFile()
                    }}
                    className="grow"
                  >
                    Save to file
                  </Button>
                </div>

                <Divider className="my-1" />

                <div className="flex flex-col gap-2">
                  <p className="font-bold">
                    Home location{" "}
                    <span>
                      <Tooltip
                        className="inline"
                        label="The home location is written to a mission save file."
                      >
                        <IconInfoCircle size={20} />
                      </Tooltip>
                    </span>
                  </p>
                  <p>
                    Lat:{" "}
                    {intToCoord(homePosition?.lat).toFixed(
                      coordsFractionDigits,
                    )}
                  </p>
                  <p>
                    Lon:{" "}
                    {intToCoord(homePosition?.lon).toFixed(
                      coordsFractionDigits,
                    )}
                  </p>
                </div>

                <Divider className="my-1" />

                <div className="flex flex-col gap-2">
                  <MissionStatistics />
                </div>
              </div>
            </ResizableBox>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Map area */}
              <div className="flex-1 relative">
                <MissionsMapSection
                  passedRef={mapRef}
                  missionItems={missionItems}
                  fenceItems={fenceItems}
                  rallyItems={rallyItems}
                />
              </div>

              {/* Resizable Bottom Bar */}
              <ResizableBox
                width={Infinity}
                height={300}
                minConstraints={[Infinity, 100]}
                maxConstraints={[Infinity, 400]}
                resizeHandles={["n"]}
                axis="y"
                handle={
                  <div className="w-full h-2 bg-falcongrey-900 hover:bg-falconred-500 cursor-row-resize absolute top-0 left-0 z-10"></div>
                }
                className="relative bg-falcongrey-800 overflow-y-auto"
                onResizeStop={(_, { size }) => {
                  setTableSectionHeight(
                    size.height -
                      tabsListRef.current.clientHeight -
                      resizeTableHeightPadding,
                  )
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(value) => dispatch(setActiveTab(value))}
                  className="mt-2"
                >
                  <Tabs.List grow ref={tabsListRef}>
                    <Tabs.Tab
                      value="mission"
                      color={tailwindColors.yellow[400]}
                    >
                      Mission
                    </Tabs.Tab>
                    <Tabs.Tab value="fence" color={tailwindColors.blue[400]}>
                      Fence
                    </Tabs.Tab>
                    <Tabs.Tab value="rally" color={tailwindColors.purple[400]}>
                      Rally
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="mission">
                    <MissionItemsTable
                      tableSectionHeight={tableSectionHeight}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="fence">
                    <FenceItemsTable tableSectionHeight={tableSectionHeight} />
                  </Tabs.Panel>
                  <Tabs.Panel value="rally">
                    <RallyItemsTable tableSectionHeight={tableSectionHeight} />
                  </Tabs.Panel>
                </Tabs>
              </ResizableBox>
            </div>
          </div>
        </div>
      ) : (
        <NoDroneConnected />
      )}
    </Layout>
  )
}
