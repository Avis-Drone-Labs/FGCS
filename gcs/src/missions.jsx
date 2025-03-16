/*
  The missions screen. 
*/

// Base imports
import { useCallback, useEffect, useRef, useState } from "react"

// 3rd Party Imports
import { useLocalStorage, useSessionStorage } from "@mantine/hooks"
import { ResizableBox } from "react-resizable"

// Custom component and helpers
import Layout from "./components/layout"
import MissionsMapSection from "./components/missions/missionsMap"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_AUTOPILOT_INVALID,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"
import { socket } from "./helpers/socket"

export default function Missions() {
  // Local Storage
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })

  // Mission
  const missionItems = {
    mission_items: [],
    fence_items: [],
    rally_items: [],
  }
  const [homePosition, setHomePosition] = useState(null)

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
    }

    socket.on("incoming_msg", (msg) => {
      if (incomingMessageHandler()[msg.mavpackettype] !== undefined) {
        incomingMessageHandler()[msg.mavpackettype](msg)
      }
      console.log(msg)
    })

    socket.on("home_position_result", (data) => {
      if (data.success) {
        setHomePosition(data.data)
      } else {
        showErrorNotification(data.message)
      }
    })

    return () => {
      socket.off("incoming_msg")
      socket.off("home_position_result")
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

  return (
    <Layout currentPage="missions">
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Resizable Sidebar */}
          <ResizableBox
            width={300}
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
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Mission Control</h2>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Current Mission</h3>
                <p>Mission Type: Idk man</p>
                <p>Status: Random Stuff</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Waypoints</h3>
                <ul className="list-disc pl-4">
                  <li>Waypoint 1: Takeoff</li>
                  <li>Waypoint 2: Navigate to target</li>
                  <li>Waypoint 3: Return home</li>
                </ul>
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
                missionItems={missionItems}
                homePosition={homePosition}
                getFlightMode={getFlightMode}
                mapId="missions"
              />
            </div>

            {/* Resizable Bottom Bar */}
            <ResizableBox
              width={Infinity}
              height={200}
              minConstraints={[Infinity, 100]}
              maxConstraints={[Infinity, 400]}
              resizeHandles={["n"]}
              axis="y"
              handle={
                <div className="w-full h-2 bg-falcongrey-900 hover:bg-falconred-500 cursor-row-resize absolute top-0 left-0 z-10"></div>
              }
              className="relative bg-falcongrey-800 overflow-y-auto"
            >
              <div className="p-4 mt-2">
                <h2 className="text-xl font-bold mb-2">Set Waypoints</h2>
              </div>
            </ResizableBox>
          </div>
        </div>
      </div>
    </Layout>
  )
}
