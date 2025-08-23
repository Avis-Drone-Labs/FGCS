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
import { coordToInt, intToCoord } from "./helpers/dataFormatters"
import { isGlobalFrameHomeCommand } from "./helpers/filterMissions"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_FRAME_LIST,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetHomePosition,
  selectConnectedToDrone,
} from "./redux/slices/droneConnectionSlice"
import {
  selectAircraftType,
  selectGPS,
  selectHeartbeat,
  selectNavController,
} from "./redux/slices/droneInfoSlice"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"
import {
  emitExportMissionToFile,
  emitGetCurrentMission,
  emitGetTargetInfo,
  emitImportMissionFromFile,
  emitWriteCurrentMission,
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
  setDrawingFenceItems,
  setDrawingMissionItems,
  setDrawingRallyItems,
  setHomePosition,
  setMissionProgressData,
  setMissionProgressModal,
  setUnwrittenChanges,
} from "./redux/slices/missionSlice"
import { queueErrorNotification } from "./redux/slices/notificationSlice"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const coordsFractionDigits = 7

function UnwrittenChangesWarning({ unwrittenChanges }) {
  const firstUnwrittenTab = Object.entries(unwrittenChanges).find(
    ([, changed]) => changed,
  )

  return (
    <>
      {firstUnwrittenTab && (
        <p className="text-red-400 text-center">
          You have unwritten {firstUnwrittenTab[0]} changes.
        </p>
      )}
    </>
  )
}

export default function Missions() {
  // Redux
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const aircraftType = useSelector(selectAircraftType)
  const heartbeatData = useSelector(selectHeartbeat)
  const gpsData = useSelector(selectGPS)
  const navControllerOutputData = useSelector(selectNavController)
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

  // File import handling
  const [importFile, setImportFile] = useState(null)
  const importFileResetRef = useRef(null)

  // Modal for mission progress
  const [missionProgressModalTitle, setMissionProgressModalTitle] = useState(
    "Mission progress update",
  )
  const [currentPage] = useSessionStorage({ key: "currentPage" })
  const mapRef = useRef()
  const newMissionItemAltitude = 30 // TODO: Make this configurable

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

  function getFlightMode() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[heartbeatData.customMode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[heartbeatData.customMode]
    }

    return "UNKNOWN"
  }

  function addNewMissionItem(lat, lon) {
    const newMissionItem = {
      id: uuidv4(),
      seq: null,
      x: coordToInt(lat),
      y: coordToInt(lon),
      z: newMissionItemAltitude,
      frame: parseInt(
        Object.keys(MAV_FRAME_LIST).find(
          (key) =>
            MAV_FRAME_LIST[key] ===
            (activeTabRef.current === "fence"
              ? "MAV_FRAME_GLOBAL"
              : "MAV_FRAME_GLOBAL_RELATIVE_ALT"),
        ),
      ),
      command: null,
      param1: activeTabRef.current === "fence" ? 5 : 0,
      param2: 0,
      param3: 0,
      param4: 0,
      current: 0,
      autocontinue: 1,
      target_component: targetInfo.target_component,
      target_system: targetInfo.target_system,
      mission_type: null,
      mavpackettype: "MISSION_ITEM_INT",
    }

    if (activeTabRef.current === "mission") {
      newMissionItem.seq = missionItems.length
      newMissionItem.command = 16 // MAV_CMD_NAV_WAYPOINT
      newMissionItem.mission_type = 0 // Mission type

      dispatch(setDrawingMissionItems([...missionItems, newMissionItem]))
    } else if (activeTabRef.current === "fence") {
      console.log("fence?", fenceItems)
      newMissionItem.seq = fenceItems.length
      newMissionItem.command = 5004 // MAV_CMD_NAV_FENCE_CIRCLE_EXCLUSION
      newMissionItem.mission_type = 1 // Fence type

      dispatch(setDrawingFenceItems([...fenceItems, newMissionItem]))
    } else if (activeTabRef.current === "rally") {
      newMissionItem.seq = rallyItems.length
      newMissionItem.command = 5100 // MAV_CMD_NAV_RALLY_POINT
      newMissionItem.mission_type = 2 // Rally type

      dispatch(setDrawingRallyItems([...rallyItems, newMissionItem]))
    }

    dispatch(
      setUnwrittenChanges({
        ...unwrittenChanges,
        [activeTabRef.current]: true,
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
      frame: parseInt(
        Object.keys(MAV_FRAME_LIST).find(
          (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL",
        ),
      ),
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

  function updateMissionItem(updatedMissionItem) {
    function getUpdatedItems(prevItems) {
      return prevItems.map((item) =>
        item.id === updatedMissionItem.id
          ? { ...item, ...updatedMissionItem }
          : item,
      )
    }

    function isEqualItem(newItem, itemsList) {
      return (
        JSON.stringify(itemsList.find((item) => item.id === newItem.id)) ===
        JSON.stringify(newItem)
      )
    }

    // Check if the updated mission item is equal to the current mission item
    // if so, don't update

    if (activeTabRef.current === "mission") {
      if (isEqualItem(updatedMissionItem, missionItems)) {
        return
      }

      dispatch(setDrawingMissionItems(getUpdatedItems(missionItems)))
    } else if (activeTabRef.current === "fence") {
      if (isEqualItem(updatedMissionItem, fenceItems)) {
        return
      }

      dispatch(setDrawingFenceItems(getUpdatedItems(fenceItems)))
    } else if (activeTabRef.current === "rally") {
      if (isEqualItem(updatedMissionItem, rallyItems)) {
        return
      }

      dispatch(setDrawingRallyItems(getUpdatedItems(rallyItems)))
    } else {
      return
    }

    dispatch(
      setUnwrittenChanges({
        ...unwrittenChanges,
        [activeTabRef.current]: true,
      }),
    )
  }

  function deleteMissionItem(missionItemId) {
    function getUpdatedItems(prevItems) {
      const updatedItems = prevItems.filter((item) => item.id !== missionItemId)

      return updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    }

    if (activeTabRef.current === "mission") {
      dispatch(setDrawingMissionItems(getUpdatedItems(missionItems)))
    } else if (activeTabRef.current === "fence") {
      dispatch(setDrawingFenceItems(getUpdatedItems(fenceItems)))
    } else if (activeTabRef.current === "rally") {
      dispatch(setDrawingRallyItems(getUpdatedItems(rallyItems)))
    }

    dispatch(
      setUnwrittenChanges({
        ...unwrittenChanges,
        [activeTabRef.current]: true,
      }),
    )
  }

  function updateMissionItemOrder(missionItemId, indexIncrement) {
    function updateItemOrder(prevItems) {
      const currentIndex = prevItems.findIndex(
        (item) => item.id === missionItemId,
      )

      // Ensure the item exists and the swap is within bounds
      if (
        currentIndex === -1 ||
        (indexIncrement === -1 && currentIndex === 0) ||
        (indexIncrement === 1 && currentIndex === prevItems.length - 1)
      ) {
        return prevItems // No changes if out of bounds
      }

      // Calculate the new index
      const newIndex = currentIndex + indexIncrement

      // Create a copy of the items array
      const updatedItems = [...prevItems]

      // Swap the items
      const temp = updatedItems[currentIndex]
      updatedItems[currentIndex] = updatedItems[newIndex]
      updatedItems[newIndex] = temp

      // Update the seq values
      updatedItems[currentIndex].seq = currentIndex
      updatedItems[newIndex].seq = newIndex

      return updatedItems
    }

    if (activeTabRef.current === "mission") {
      dispatch(setDrawingMissionItems(updateItemOrder(missionItems)))
      dispatch(setUnwrittenChanges({ ...unwrittenChanges, mission: true }))
    } else if (activeTabRef.current === "fence") {
      dispatch(setDrawingFenceItems(updateItemOrder(fenceItems)))
      dispatch(setUnwrittenChanges({ ...unwrittenChanges, fence: true }))
    }
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

  function updateMissionHomePosition(lat, lon) {
    const newHomePosition = {
      lat: Number.isInteger(lat) ? lat : coordToInt(lat),
      lon: Number.isInteger(lon) ? lon : coordToInt(lon),
      alt: 0.1,
    }
    dispatch(setHomePosition(newHomePosition))

    // Also update the first waypoint if it is a home position waypoint
    if (missionItems.length > 0 && isGlobalFrameHomeCommand(missionItems[0])) {
      // Check if the first item is a home position command
      const updatedMissionItems = [...missionItems]
      updatedMissionItems[0] = {
        ...updatedMissionItems[0],
        x: newHomePosition.lat,
        y: newHomePosition.lon,
      }
      dispatch(setDrawingMissionItems(updatedMissionItems))
    } else {
      // If the first item is not a home position command, add a new home position item
      const newHomeMissionItem = {
        id: uuidv4(),
        seq: 0,
        x: newHomePosition.lat,
        y: newHomePosition.lon,
        z: 0.1,
        frame: parseInt(
          Object.keys(MAV_FRAME_LIST).find(
            (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL",
          ),
        ),
        command: 16, // MAV_CMD_NAV_WAYPOINT
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
        current: 0,
        autocontinue: 1,
        target_component: targetInfo.target_component,
        target_system: targetInfo.target_system,
        mission_type: 0,
        mavpackettype: "MISSION_ITEM_INT",
      }
      dispatch(
        setDrawingMissionItems((prevItems) => [
          newHomeMissionItem,
          ...prevItems,
        ]),
      )
    }

    dispatch(setUnwrittenChanges({ ...unwrittenChanges, mission: true }))
  }

  function clearMissionItems() {
    if (activeTabRef.current === "mission") {
      // Clear all mission items except the first if the first is a home position
      if (
        missionItems.length > 0 &&
        isGlobalFrameHomeCommand(missionItems[0])
      ) {
        dispatch(setDrawingMissionItems([missionItems[0]]))
      } else {
        dispatch(setDrawingMissionItems([]))
      }
    } else if (activeTabRef.current === "fence") {
      dispatch(setDrawingFenceItems([]))
    } else if (activeTabRef.current === "rally") {
      dispatch(setDrawingRallyItems([]))
    }

    dispatch(
      setUnwrittenChanges({
        ...unwrittenChanges,
        [activeTabRef.current]: true,
      }),
    )
  }

  function addFencePolygon(newFenceItems) {
    let seqNumber =
      fenceItems.length > 0 ? fenceItems[fenceItems.length - 1].seq + 1 : 0

    const newFenceMissionItems = newFenceItems.map((item) => {
      const newFenceMissionItem = {
        id: item.id,
        seq: seqNumber,
        x: item.x,
        y: item.y,
        z: item.z,
        frame: parseInt(
          Object.keys(MAV_FRAME_LIST).find(
            (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL_RELATIVE_ALT",
          ),
        ),
        command: item.command,
        param1: item.param1,
        param2: item.param2,
        param3: item.param3,
        param4: item.param4,
        current: 0,
        autocontinue: 1,
        target_component: targetInfo.target_component,
        target_system: targetInfo.target_system,
        mission_type: 1, // Fence type
        mavpackettype: "MISSION_ITEM_INT",
      }

      seqNumber++

      return newFenceMissionItem
    })

    dispatch(setDrawingFenceItems([...fenceItems, ...newFenceMissionItems]))
    dispatch(setUnwrittenChanges({ ...unwrittenChanges, fence: true }))
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
                  <MissionStatistics missionItems={missionItems} />
                </div>
              </div>
            </ResizableBox>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Map area */}
              <div className="flex-1 relative">
                <MissionsMapSection
                  passedRef={mapRef}
                  data={gpsData}
                  heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
                  desiredBearing={navControllerOutputData.nav_bearing}
                  missionItems={{
                    mission_items: missionItems,
                    fence_items: fenceItems,
                    rally_items: rallyItems,
                  }}
                  homePosition={homePosition}
                  getFlightMode={getFlightMode}
                  currentTab={activeTab}
                  markerDragEndCallback={updateMissionItem}
                  addNewMissionItem={addNewMissionItem}
                  updateMissionHomePosition={updateMissionHomePosition}
                  clearMissionItems={clearMissionItems}
                  addFencePolygon={addFencePolygon}
                  mapId="missions"
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
              >
                <Tabs
                  value={activeTab}
                  onChange={(value) => dispatch(setActiveTab(value))}
                  className="mt-2"
                >
                  <Tabs.List grow>
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
                      missionItems={missionItems}
                      aircraftType={aircraftType}
                      updateMissionItem={updateMissionItem}
                      deleteMissionItem={deleteMissionItem}
                      updateMissionItemOrder={updateMissionItemOrder}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="fence">
                    <FenceItemsTable
                      fenceItems={fenceItems}
                      updateMissionItem={updateMissionItem}
                      deleteMissionItem={deleteMissionItem}
                      updateMissionItemOrder={updateMissionItemOrder}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="rally">
                    <RallyItemsTable
                      rallyItems={rallyItems}
                      updateRallyItem={updateMissionItem}
                      deleteRallyItem={deleteMissionItem}
                    />
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
