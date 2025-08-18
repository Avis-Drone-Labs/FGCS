/*
  The missions screen.
*/

// Base imports
import { useCallback, useEffect, useRef, useState } from "react"

// 3rd Party Imports
import {
  useDisclosure,
  useLocalStorage,
  useSessionStorage,
} from "@mantine/hooks"
import { ResizableBox } from "react-resizable"
import { v4 as uuidv4 } from "uuid"

// Custom component and helpers
import {
  Button,
  Divider,
  FileButton,
  Modal,
  Progress,
  Tabs,
  Tooltip,
} from "@mantine/core"
import { IconInfoCircle } from "@tabler/icons-react"
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
  MAV_AUTOPILOT_INVALID,
  MAV_FRAME_LIST,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification"
import { socket } from "./helpers/socket"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const coordsFractionDigits = 7

export default function Missions() {
  // Local Storage
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })

  const [activeTab, setActiveTab] = useState("mission")
  const [unwrittenMissionChanges, setUnwrittenMissionChanges] =
    useSessionStorage({
      key: "unwrittenMissionChanges",
      defaultValue: false,
    })
  const [unwrittenFenceChanges, setUnwrittenFenceChanges] = useSessionStorage({
    key: "unwrittenFenceChanges",
    defaultValue: false,
  })
  const [unwrittenRallyChanges, setUnwrittenRallyChanges] = useSessionStorage({
    key: "unwrittenRallyChanges",
    defaultValue: false,
  })

  // Mission data
  const [missionItems, setMissionItems] = useSessionStorage({
    key: "missionItems",
    defaultValue: [],
  })
  const [fenceItems, setFenceItems] = useSessionStorage({
    key: "fenceItems",
    defaultValue: [],
  })
  const [rallyItems, setRallyItems] = useSessionStorage({
    key: "rallyItems",
    defaultValue: [],
  })
  const [homePosition, setHomePosition] = useSessionStorage({
    key: "homePosition",
    defaultValue: null,
  })
  const [targetInfo, setTargetInfo] = useSessionStorage({
    key: "targetInfo",
    defaultValue: { target_component: 0, target_system: 255 },
  })

  // File import handling
  const [importFile, setImportFile] = useState(null)
  const importFileResetRef = useRef(null)

  // Modal for mission progress
  const [
    missionProgressModalOpened,
    { open: openMissionProgressModal, close: closeMissionProgressModal },
  ] = useDisclosure(false)
  const [missionProgressModalTitle, setMissionProgressModalTitle] = useState(
    "Mission progress update",
  )
  const [missionProgressModalData, setMissionProgressModalData] = useState({})

  // Drone data
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })
  const [gpsData, setGpsData] = useState({})
  const [navControllerOutputData, setNavControllerOutputData] = useState({})

  const mapRef = useRef()

  const newMissionItemAltitude = 30 // TODO: Make this configurable

  const incomingMessageHandler = useCallback(
    () => ({
      GLOBAL_POSITION_INT: (msg) => setGpsData(msg),
      NAV_CONTROLLER_OUTPUT: (msg) => setNavControllerOutputData(msg),
      HEARTBEAT: (msg) => {
        if (msg.autopilot !== MAV_AUTOPILOT_INVALID) {
          setHeartbeatData(msg)
        }
      },
    }),
    [],
  )

  // useEffect(() => {
  //   setActiveTab("mission") // Default to mission tab on load
  // }, [])

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit("get_home_position")
      socket.emit("get_target_info")
    }

    socket.on("incoming_msg", (msg) => {
      if (incomingMessageHandler()[msg.mavpackettype] !== undefined) {
        incomingMessageHandler()[msg.mavpackettype](msg)
      }
    })

    socket.on("home_position_result", (data) => {
      if (data.success) {
        setHomePosition(data.data)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("target_info", (data) => {
      if (data) {
        setTargetInfo(data)
      }
    })

    socket.on("current_mission", (data) => {
      closeMissionProgressModal()

      if (!data.success) {
        showErrorNotification(data.message)
        return
      }

      if (data.mission_type === "mission") {
        const missionItemsWithIds = []
        for (let missionItem of data.items) {
          missionItemsWithIds.push(addIdToItem(missionItem))
        }
        updateHomePositionBasedOnWaypoints(missionItemsWithIds)
        setMissionItems(missionItemsWithIds)
        setUnwrittenMissionChanges(false)
      } else if (data.mission_type === "fence") {
        const fenceItemsWithIds = []
        for (let fence of data.items) {
          fenceItemsWithIds.push(addIdToItem(fence))
        }
        setFenceItems(fenceItemsWithIds)
        setUnwrittenFenceChanges(false)
      } else if (data.mission_type === "rally") {
        const rallyItemsWithIds = []
        for (let rallyItem of data.items) {
          rallyItemsWithIds.push(addIdToItem(rallyItem))
        }
        setRallyItems(rallyItemsWithIds)
        setUnwrittenRallyChanges(false)
      }

      showSuccessNotification(`${data.mission_type} read successfully`)
    })

    socket.on("write_mission_result", (data) => {
      closeMissionProgressModal()

      if (data.success) {
        showSuccessNotification(data.message)
        if (data.mission_type === "mission") {
          setUnwrittenMissionChanges(false)
        } else if (data.mission_type === "fence") {
          setUnwrittenFenceChanges(false)
        } else if (data.mission_type === "rally") {
          setUnwrittenRallyChanges(false)
        }
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("import_mission_result", (data) => {
      if (data.success) {
        if (data.mission_type === "mission") {
          const missionItemsWithIds = []
          for (let missionItem of data.items) {
            missionItemsWithIds.push(addIdToItem(missionItem))
          }

          updateHomePositionBasedOnWaypoints(missionItemsWithIds)
          setMissionItems(missionItemsWithIds)
          setUnwrittenMissionChanges(false)
        } else if (data.mission_type === "fence") {
          const fenceItemsWithIds = []
          for (let fence of data.items) {
            fenceItemsWithIds.push(addIdToItem(fence))
          }
          setFenceItems(fenceItemsWithIds)
          setUnwrittenFenceChanges(false)
        } else if (data.mission_type === "rally") {
          const rallyItemsWithIds = []
          for (let rallyItem of data.items) {
            rallyItemsWithIds.push(addIdToItem(rallyItem))
          }

          setRallyItems(rallyItemsWithIds)
          setUnwrittenRallyChanges(false)
        }
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("export_mission_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("current_mission_progress", (data) => {
      setMissionProgressModalData(data)
    })

    return () => {
      socket.off("incoming_msg")
      socket.off("home_position_result")
      socket.off("target_info")
      socket.off("current_mission")
      socket.off("write_mission_result")
      socket.off("import_mission_result")
      socket.off("export_mission_result")
      socket.off("current_mission_progress")
    }
  }, [connected])

  useEffect(() => {
    if (importFile) {
      importMissionFromFile(importFile.path)
    }
  }, [importFile])

  useEffect(() => {
    console.log(activeTab)
  }, [activeTab])

  function updateCurrentTabUnwrittenChanges(newValue) {
    console.log(activeTab)
    if (activeTab === "mission") {
      setUnwrittenMissionChanges(newValue)
    } else if (activeTab === "fence") {
      setUnwrittenFenceChanges(newValue)
    } else if (activeTab === "rally") {
      setUnwrittenRallyChanges(newValue)
    }
  }

  function resetMissionProgressModalData() {
    setMissionProgressModalData({
      message: "",
      progress: null,
    })
  }

  function updateHomePositionBasedOnWaypoints(waypoints) {
    if (waypoints.length > 0) {
      const potentialHomeLocation = waypoints[0]
      if (isGlobalFrameHomeCommand(potentialHomeLocation)) {
        setHomePosition({
          lat: potentialHomeLocation.x,
          lon: potentialHomeLocation.y,
          alt: potentialHomeLocation.z,
        })
      }
    }
  }

  function getFlightMode() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[heartbeatData.custom_mode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[heartbeatData.custom_mode]
    }

    return "UNKNOWN"
  }

  function addIdToItem(missionItem) {
    if (!missionItem.id) {
      missionItem.id = uuidv4()
    }
    return missionItem
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
          (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL_RELATIVE_ALT",
        ),
      ),
      command: null,
      param1: activeTab === "fence" ? 5 : 0,
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

    if (activeTab === "mission") {
      newMissionItem.seq = missionItems.length
      newMissionItem.command = 16 // MAV_CMD_NAV_WAYPOINT
      newMissionItem.mission_type = 0 // Mission type

      setMissionItems((prevItems) => [...prevItems, newMissionItem])
    } else if (activeTab === "fence") {
      newMissionItem.seq = fenceItems.length
      newMissionItem.command = 5004 // MAV_CMD_NAV_FENCE_CIRCLE_EXCLUSION
      newMissionItem.mission_type = 1 // Fence type

      setFenceItems((prevItems) => [...prevItems, newMissionItem])
    } else if (activeTab === "rally") {
      newMissionItem.seq = rallyItems.length
      newMissionItem.command = 5100 // MAV_CMD_NAV_RALLY_POINT
      newMissionItem.mission_type = 2 // Rally type

      setRallyItems((prevItems) => [...prevItems, newMissionItem])
    }

    console.log("unwritten changes true add new mission item", activeTab)
    updateCurrentTabUnwrittenChanges(false)
  }

  function createHomePositionItem() {
    if (!homePosition) {
      showErrorNotification("Home position is not set")
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
        activeTab === "mission"
          ? 0
          : activeTab === "fence"
            ? 1
            : activeTab === "rally"
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

    if (activeTab === "mission") {
      if (isEqualItem(updatedMissionItem, missionItems)) {
        return
      }

      setMissionItems((prevItems) => getUpdatedItems(prevItems))
    } else if (activeTab === "fence") {
      if (isEqualItem(updatedMissionItem, fenceItems)) {
        return
      }

      setFenceItems((prevItems) => getUpdatedItems(prevItems))
    } else if (activeTab === "rally") {
      if (isEqualItem(updatedMissionItem, rallyItems)) {
        return
      }

      setRallyItems((prevItems) => getUpdatedItems(prevItems))
    }

    console.log("unwritten changes true update mission item", activeTab)

    updateCurrentTabUnwrittenChanges(true)
  }

  function deleteMissionItem(missionItemId) {
    function getUpdatedItems(prevItems) {
      const updatedItems = prevItems.filter((item) => item.id !== missionItemId)

      return updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    }

    if (activeTab === "mission") {
      setMissionItems((prevItems) => getUpdatedItems(prevItems))
    } else if (activeTab === "fence") {
      setFenceItems((prevItems) => getUpdatedItems(prevItems))
    } else if (activeTab === "rally") {
      setRallyItems((prevItems) => getUpdatedItems(prevItems))
    }

    console.log("unwritten changes true delete mission item", activeTab)

    updateCurrentTabUnwrittenChanges(true)
    // if (activeTab === "mission") {
    //   setUnwrittenMissionChanges(newValue)
    // } else if (activeTab === "fence") {
    //   setUnwrittenFenceChanges(newValue)
    // } else if (activeTab === "rally") {
    //   setUnwrittenRallyChanges(newValue)
    // }
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

    console.log("unwritten changes true update item order", activeTab)

    if (activeTab === "mission") {
      setMissionItems((prevItems) => updateItemOrder(prevItems))
      setUnwrittenMissionChanges(true)
    } else if (activeTab === "fence") {
      setFenceItems((prevItems) => updateItemOrder(prevItems))
      setUnwrittenFenceChanges(true)
    }
  }

  function readMissionFromDrone() {
    socket.emit("get_current_mission", { type: activeTab })
    setMissionProgressModalTitle(`Reading ${activeTab} from drone`)
    resetMissionProgressModalData()
    openMissionProgressModal()
  }

  function writeMissionToDrone() {
    if (activeTab === "mission") {
      socket.emit("write_current_mission", {
        type: "mission",
        items: missionItems,
      })
    } else if (activeTab === "fence") {
      socket.emit("write_current_mission", { type: "fence", items: fenceItems })
    } else if (activeTab === "rally") {
      socket.emit("write_current_mission", { type: "rally", items: rallyItems })
    }
    setMissionProgressModalTitle(`Writing ${activeTab} to drone`)
    resetMissionProgressModalData()
    openMissionProgressModal()
  }

  function importMissionFromFile(filePath) {
    socket.emit("import_mission_from_file", {
      type: activeTab,
      file_path: filePath,
    })

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
      if (activeTab === "mission") {
        items = [...missionItems]
      } else if (activeTab === "fence") {
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
      } else if (activeTab === "rally") {
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

      socket.emit("export_mission_to_file", {
        type: activeTab,
        file_path: result.filePath,
        items: items,
      })
    }
  }

  function updateMissionHomePosition(lat, lon) {
    const newHomePosition = {
      lat: Number.isInteger(lat) ? lat : coordToInt(lat),
      lon: Number.isInteger(lon) ? lon : coordToInt(lon),
      alt: 0.1,
    }
    setHomePosition(newHomePosition)

    // Also update the first waypoint if it is a home position waypoint
    if (missionItems.length > 0 && isGlobalFrameHomeCommand(missionItems[0])) {
      // Check if the first item is a home position command
      const updatedMissionItems = [...missionItems]
      updatedMissionItems[0] = {
        ...updatedMissionItems[0],
        x: newHomePosition.lat,
        y: newHomePosition.lon,
      }
      setMissionItems(updatedMissionItems)
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
      setMissionItems((prevItems) => [newHomeMissionItem, ...prevItems])
    }
    console.log("unwritten changes true update home position", activeTab)

    setUnwrittenMissionChanges(true)
  }

  function clearMissionItems() {
    if (activeTab === "mission") {
      // Clear all mission items except the first if the first is a home position
      if (
        missionItems.length > 0 &&
        isGlobalFrameHomeCommand(missionItems[0])
      ) {
        setMissionItems([missionItems[0]])
      } else {
        setMissionItems([])
      }
    } else if (activeTab === "fence") {
      setFenceItems([])
    } else if (activeTab === "rally") {
      setRallyItems([])
    }

    console.log("unwritten changes true clear mission items", activeTab)

    updateCurrentTabUnwrittenChanges(false)
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

    setFenceItems((prevItems) => [...prevItems, ...newFenceMissionItems])
    setUnwrittenFenceChanges(true)
  }

  return (
    <Layout currentPage="missions">
      <Modal
        opened={missionProgressModalOpened}
        onClose={closeMissionProgressModal}
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
      <div className="bg-falconred-700 text-white text-center">
        Missions is still under development so some features are still missing.
      </div>

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
                  {((unwrittenMissionChanges && activeTab === "mission") ||
                    (unwrittenFenceChanges && activeTab === "fence") ||
                    (unwrittenRallyChanges && activeTab === "rally")) && (
                    <p className="text-red-500">You have unwritten changes.</p>
                  )}
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
                  onChange={setActiveTab}
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
