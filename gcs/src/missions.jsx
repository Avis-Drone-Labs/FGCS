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
import { Button, Divider, Tabs } from "@mantine/core"
import Layout from "./components/layout"
import MissionItemsTable from "./components/missions/missionItemsTable"
import MissionsMapSection from "./components/missions/missionsMap"
import RallyItemsTable from "./components/missions/rallyItemsTable"
import NoDroneConnected from "./components/noDroneConnected"
import { intToCoord } from "./helpers/dataFormatters"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_AUTOPILOT_INVALID,
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

  // Mission - Test data for development
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

  // Heartbeat data
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })

  // GPS and Telemetry
  const [gpsData, setGpsData] = useState({})

  // Map and messages
  const mapRef = useRef()

  // System data
  const [navControllerOutputData, setNavControllerOutputData] = useState({})
  const [isUploading, setIsUploading] = useState(false)

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

    socket.on("current_mission", (data) => {
      if (!data.success) {
        showErrorNotification(data.message)
        return
      }

      console.log(data)

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

    socket.on("upload_mission_result", (data) => {
      console.log("📨 Received upload_mission_result:", data)
      setIsUploading(false)
      if (data.success) {
        console.log("✅ Mission upload successful!")
        showSuccessNotification(data.message)
      } else {
        console.log("❌ Mission upload failed:", data.message)
        showErrorNotification(data.message)
      }
    })

    return () => {
      socket.off("incoming_msg")
      socket.off("home_position_result")
      socket.off("current_mission")
      socket.off("upload_mission_result")
    }
  }, [connected])

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

  function readMissionFromDrone() {
    socket.emit("get_current_mission", { type: activeTab })
  }

  function writeMissionToDrone() {
    console.log("🚀 Write Mission Button Pressed!")
    console.log("📊 Current state:", {
      connected,
      isUploading,
      activeTab,
      missionItemsCount: missionItems.length,
      fenceItemsCount: fenceItems.length,
      rallyItemsCount: rallyItems.length
    })

    if (!connected) {
      console.log("❌ Not connected to drone")
      showErrorNotification("Not connected to drone")
      return
    }

    if (isUploading) {
      console.log("⏳ Mission upload already in progress")
      showErrorNotification("Mission upload already in progress")
      return
    }

    let missionData = []
    if (activeTab === "mission") {
      missionData = missionItems
      console.log("📋 Using mission items:", missionItems)
    } else if (activeTab === "fence") {
      missionData = fenceItems
      console.log("🚧 Using fence items:", fenceItems)
    } else if (activeTab === "rally") {
      missionData = rallyItems
      console.log("📍 Using rally items:", rallyItems)
    }

    if (missionData.length === 0) {
      console.log(`❌ No ${activeTab} items to upload`)
      showErrorNotification(`No ${activeTab} items to upload`)
      return
    }

    console.log(`✅ Found ${missionData.length} ${activeTab} items to upload`)
    setIsUploading(true)

    // Convert mission items to the format expected by the backend
    const formattedMissionData = missionData.map((item, index) => {
      const formatted = {
        seq: index,
        frame: item.frame || 3, // MAV_FRAME_GLOBAL_RELATIVE_ALT
        command: item.command || 16, // MAV_CMD_NAV_WAYPOINT
        current: item.current || 0,
        autocontinue: item.autocontinue || 1,
        param1: item.param1 || 0.0,
        param2: item.param2 || 0.0,
        param3: item.param3 || 0.0,
        param4: item.param4 || 0.0,
        x: item.x || 0, // latitude as integer (1e7 * degrees)
        y: item.y || 0, // longitude as integer (1e7 * degrees)
        z: item.z || 0.0, // altitude
      }
      console.log(`📝 Formatted item ${index}:`, formatted)
      return formatted
    })

    console.log("📤 Sending mission data to backend:", {
      type: activeTab,
      mission_data: formattedMissionData
    })

    socket.emit("upload_mission", {
      type: activeTab,
      mission_data: formattedMissionData,
    })

    console.log("⏰ Setting 30-second timeout for upload...")

    // Set a timeout to handle cases where the upload might hang
    setTimeout(() => {
      if (isUploading) {
        console.log("⏰ Mission upload timed out!")
        setIsUploading(false)
        showErrorNotification("Mission upload timed out. Please try again.")
      }
    }, 30000) // 30 second timeout
  }

  function importMissionFromFile() {
    return
  }

  function saveMissionToFile() {
    return
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
                    disabled={!connected || isUploading}
                    loading={isUploading}
                    className="grow"
                  >
                    {isUploading ? `Uploading ${activeTab}...` : `Write ${activeTab}`}
                  </Button>
                </div>


                <Divider className="my-1" />

                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => {
                      importMissionFromFile()
                    }}
                    className="grow"
                  >
                    Import from file
                  </Button>
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
