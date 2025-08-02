/*
  The missions screen.
*/

// Base imports
import { useCallback, useEffect, useRef, useState } from "react"

// 3rd Party Imports
import { useLocalStorage, useSessionStorage } from "@mantine/hooks"
import { ResizableBox } from "react-resizable"
import { v4 as uuidv4 } from "uuid"

// Custom component and helpers
import { Button, Divider, FileButton, Tabs } from "@mantine/core"
import Layout from "./components/layout"
import MissionItemsTable from "./components/missions/missionItemsTable"
import MissionsMapSection from "./components/missions/missionsMap"
import RallyItemsTable from "./components/missions/rallyItemsTable"
import NoDroneConnected from "./components/noDroneConnected"
import { coordToInt, intToCoord } from "./helpers/dataFormatters"
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

  // Mission
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
  const [importFile, setImportFile] = useState(null)
  const importFileResetRef = useRef(null)

  const newMissionItemAltitude = 30 // TODO: Make this configurable

  // Heartbeat data
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })

  // GPS and Telemetry
  const [gpsData, setGpsData] = useState({})

  // Map and messages
  const mapRef = useRef()

  // System data
  const [navControllerOutputData, setNavControllerOutputData] = useState({})

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

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit("set_state", { state: "missions" })
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
      if (!data.success) {
        showErrorNotification(data.message)
        return
      }

      if (data.mission_type === "mission") {
        const missionItemsWithIds = []
        for (let missionItem of data.items) {
          missionItemsWithIds.push(addIdToItem(missionItem))
        }
        setMissionItems(missionItemsWithIds)
      } else if (data.mission_type === "fence") {
        setFenceItems(data.items)
      } else if (data.mission_type === "rally") {
        const rallyItemsWithIds = []
        for (let rallyItem of data.items) {
          rallyItemsWithIds.push(addIdToItem(rallyItem))
        }
        setRallyItems(rallyItemsWithIds)
      }

      showSuccessNotification(`${data.mission_type} read successfully`)
    })

    socket.on("write_mission_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
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
          setMissionItems(missionItemsWithIds)
        } else if (data.mission_type === "fence") {
          setFenceItems(data.items)
        } else if (data.mission_type === "rally") {
          const rallyItemsWithIds = []
          for (let rallyItem of data.items) {
            rallyItemsWithIds.push(addIdToItem(rallyItem))
          }
          setRallyItems(rallyItemsWithIds)
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

    return () => {
      socket.off("incoming_msg")
      socket.off("home_position_result")
      socket.off("target_info")
      socket.off("current_mission")
      socket.off("write_mission_result")
      socket.off("import_mission_result")
      socket.off("export_mission_result")
    }
  }, [connected])

  useEffect(() => {
    if (importFile) {
      importMissionFromFile(importFile.path)
    }
  }, [importFile])

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
      seq: missionItems.length,
      x: coordToInt(lat),
      y: coordToInt(lon),
      z: newMissionItemAltitude,
      frame: parseInt(
        Object.keys(MAV_FRAME_LIST).find(
          (key) => MAV_FRAME_LIST[key] === "MAV_FRAME_GLOBAL_RELATIVE_ALT",
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

    setMissionItems((prevItems) => [...prevItems, newMissionItem])
  }

  function updateMissionItem(updatedMissionItem) {
    setMissionItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedMissionItem.id
          ? { ...item, ...updatedMissionItem }
          : item,
      ),
    )
  }
  function updateRallyItem(updatedRallyItem) {
    setRallyItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedRallyItem.id
          ? { ...item, ...updatedRallyItem }
          : item,
      ),
    )
  }

  function deleteMissionItem(missionItemId) {
    setMissionItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== missionItemId)

      return updatedItems.map((item, index) => ({
        ...item,
        seq: index, // Reassign seq based on the new order
      }))
    })
  }

  function updateMissionItemOrder(missionItemId, indexIncrement) {
    setMissionItems((prevItems) => {
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
    })
  }

  function readMissionFromDrone() {
    socket.emit("get_current_mission", { type: activeTab })
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
        items = missionItems
      } else if (activeTab === "fence") {
        items = fenceItems
      } else if (activeTab === "rally") {
        items = rallyItems
      }

      socket.emit("export_mission_to_file", {
        type: activeTab,
        file_path: result.filePath,
        items: items,
      })
    }
  }

  return (
    <Layout currentPage="missions">
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
                  <p className="font-bold">Home location</p>
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
                  rallyDragEndCallback={updateRallyItem}
                  addNewMissionItem={addNewMissionItem}
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
                    <Tabs.Tab value="mission">Mission</Tabs.Tab>
                    <Tabs.Tab value="fence">Fence</Tabs.Tab>
                    <Tabs.Tab value="rally">Rally</Tabs.Tab>
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
                  <Tabs.Panel value="fence"></Tabs.Panel>
                  <Tabs.Panel value="rally">
                    <RallyItemsTable
                      rallyItems={rallyItems}
                      updateRallyItem={updateRallyItem}
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
