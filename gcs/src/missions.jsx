/*
  The missions screen. 
*/

// Base imports
import { useEffect, useState, useRef } from "react"

// 3rd Party Imports
import { useLocalStorage } from "@mantine/hooks"
import { ResizableBox } from "react-resizable"

// Custom component and helpers
import Layout from "./components/layout"
import MapSection from "./components/dashboard/map"
import {
    COPTER_MODES_FLIGHT_MODE_MAP,
    PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"

export default function Missions() {
  // Local Storage
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })
  // Mission
  const [missionItems, _setMissionItems] = useState({
    mission_items: [],
    fence_items: [],
    rally_items: [],
  })
  const [homePosition, _setHomePosition] = useState(null)

  // Heartbeat data
  const [heartbeatData, _setHeartbeatData] = useState({ system_status: 0 })

  // Following Drone
  const [followDrone, setFollowDrone] = useState(false)

  // GPS and Telemetry
  const [gpsData, _setGpsData] = useState({})

  // Map and messages
  const mapRef = useRef()

  // System data
  const [navControllerOutputData, _setNavControllerOutputData] = useState({})

  // Following drone logic
  useEffect(() => {
    if (
      mapRef.current &&
      gpsData?.lon !== 0 &&
      gpsData?.lat !== 0 &&
      followDrone
    ) {
      let lat = parseFloat(gpsData.lat * 1e-7)
      let lon = parseFloat(gpsData.lon * 1e-7)
      mapRef.current.setCenter({ lng: lon, lat: lat })
    }
  }, [gpsData])

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
              <MapSection
                passedRef={mapRef}
                data={gpsData}
                heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
                desiredBearing={navControllerOutputData.nav_bearing}
                missionItems={missionItems}
                homePosition={homePosition}
                onDragstart={() => {
                  setFollowDrone(false)
                }}
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
