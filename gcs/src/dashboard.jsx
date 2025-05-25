/*
  The dashboard screen. This is the first screen to be loaded in and is where the user will
  spend most of their time.

  This contains the map, live indicator, and GPS data. All of these are imported as components
  and are integrated in this file with logic linking them together.
*/

// Base imports
import { useCallback, useEffect, useRef, useState } from "react"

// 3rd Party Imports
import { Divider } from "@mantine/core"
import {
  useListState,
  useLocalStorage,
  usePrevious,
  useSessionStorage,
  useViewportSize,
} from "@mantine/hooks"
import {
  IconAntenna,
  IconBattery2,
  IconGps,
  IconRadar,
  IconSatellite,
} from "@tabler/icons-react"
import { ResizableBox } from "react-resizable"

// Helper javascript files
import { defaultDataMessages } from "./helpers/dashboardDefaultDataMessages"
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  GPS_FIX_TYPES,
  MAV_AUTOPILOT_INVALID,
  MAV_STATE,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification"
import { socket } from "./helpers/socket"

// Custom component
import useSound from "use-sound"
import FloatingToolbar from "./components/dashboard/floatingToolbar"
import MapSection from "./components/dashboard/map"
import ResizableInfoBox from "./components/dashboard/resizableInfoBox"
import StatusBar, { StatusSection } from "./components/dashboard/statusBar"
import StatusMessages from "./components/dashboard/statusMessages"
import TabsSection from "./components/dashboard/tabsSection"
import TelemetrySection from "./components/dashboard/telemetry"
import Layout from "./components/layout"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Sounds
import armSound from "./assets/sounds/armed.mp3"
import disarmSound from "./assets/sounds/disarmed.mp3"
import { AlertCategory, AlertSeverity } from "./components/dashboard/alert"
import { useAlerts } from "./components/dashboard/alertProvider"
import { useSettings } from "./helpers/settings"

export default function Dashboard() {
  // Local Storage
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })

  // Telemetry panel sizing
  const [telemetryPanelSize, setTelemetryPanelSize] = useLocalStorage({
    key: "telemetryPanelSize",
    defaultValue: { width: 400, height: Infinity },
    deserialize: (value) => {
      const parsed = JSON.parse(value)
      if (parsed === null || parsed === undefined)
        return { width: 400, height: Infinity }
      return { ...parsed, width: Math.max(parsed["width"], 275) }
    },
  })
  const [telemetryFontSize, setTelemetryFontSize] = useState(
    calcBigTextFontSize(),
  )
  const sideBarRef = useRef()
  const [messagesPanelSize, setMessagesPanelSize] = useLocalStorage({
    key: "messagesPanelSize",
    defaultValue: { width: 600, height: 150 },
  })

  const { height: viewportHeight, width: viewportWidth } = useViewportSize()

  // Heartbeat data
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })
  const previousHeartbeatData = usePrevious(heartbeatData)

  // System data
  const [batteryData, setBatteryData] = useState([])
  const [navControllerOutputData, setNavControllerOutputData] = useState({})
  const [statustextMessages, statustextMessagesHandler] = useListState([])
  const [sysStatusData, setSysStatusData] = useState({
    onboard_control_sensors_enabled: 0,
  })
  const [rcChannelsData, setRCChannelsData] = useState({ rssi: 0 })

  // GPS and Telemetry
  const [gpsData, setGpsData] = useState({})
  const [telemetryData, setTelemetryData] = useState({})
  const [attitudeData, setAttitudeData] = useState({ roll: 0, pitch: 0 })
  const [gpsRawIntData, setGpsRawIntData] = useState({
    fix_type: 0,
    satellites_visible: 0,
  })
  const [currentMissionData, setCurrentMissionData] = useState({
    mission_state: 0,
    seq: 0,
    total: 0,
  })

  // Mission
  const [missionItems, setMissionItems] = useState({
    mission_items: [],
    fence_items: [],
    rally_items: [],
  })
  const [homePosition, setHomePosition] = useState(null)

  // Following Drone
  const [followDrone, setFollowDrone] = useSessionStorage({
    key: "followDroneBool",
    defaultValue: false,
  })
  const [currentFlightModeNumber, setCurrentFlightModeNumber] = useState(null)

  // Map and messages
  const mapRef = useRef()

  // Sounds
  const [playArmed] = useSound(armSound, { volume: 0.1 })
  const [playDisarmed] = useSound(disarmSound, { volume: 0.1 })

  const [displayedData, setDisplayedData] = useLocalStorage({
    key: "dashboardDataMessages",
    defaultValue: defaultDataMessages,
  })

  const { getSetting } = useSettings()

  // Alerts
  const { dispatchAlert, dismissAlert } = useAlerts()
  const highestAltitudeRef = useRef(0)

  function updateAltitudeAlert(msg) {
    if (msg.alt > highestAltitudeRef.current) return highestAltitudeRef.current = msg.alt
    const altitudes = getSetting("Config.altitudeAlerts")
    altitudes.sort((a1, a2) => a1 - a2)

    for (const [i, altitude] of altitudes.entries()) {
      if (highestAltitudeRef.current > altitude && msg.alt < altitude) {
        dispatchAlert({
          category: AlertCategory.Altitude,
          severity: i == 0 ? AlertSeverity.Red : (i == altitudes.length - 1 ? AlertSeverity.Yellow : AlertSeverity.Orange),
          jsx: <>Caution! You've fallen below {altitude}m</>
        })
        return
      }
    }

    dismissAlert(AlertCategory.Altitude)
  }

  const incomingMessageHandler = useCallback(
    () => ({
      VFR_HUD: (msg) => {
        setTelemetryData(msg)
        updateAltitudeAlert(msg)
      },
      BATTERY_STATUS: (msg) => {
        const battery = localBatteryData.filter(battery => battery.id == msg.id)[0]
        if (battery) {
          Object.assign(battery, msg)
        } else {
          localBatteryData.push(msg)
        }
        localBatteryData.sort((b1, b2) => b1.id - b2.id)
        setBatteryData(localBatteryData)
      },
      ATTITUDE: (msg) => setAttitudeData(msg),
      GLOBAL_POSITION_INT: (msg) => setGpsData(msg),
      NAV_CONTROLLER_OUTPUT: (msg) => setNavControllerOutputData(msg),
      HEARTBEAT: (msg) => {
        if (msg.autopilot !== MAV_AUTOPILOT_INVALID) {
          setHeartbeatData(msg)
        }
      },
      STATUSTEXT: (msg) => statustextMessagesHandler.prepend(msg),
      SYS_STATUS: (msg) => setSysStatusData(msg),
      GPS_RAW_INT: (msg) => setGpsRawIntData(msg),
      RC_CHANNELS: (msg) => setRCChannelsData(msg),
      MISSION_CURRENT: (msg) => setCurrentMissionData(msg),
    }),
    [],
  )

  useEffect(() => {
    // Use localStorage.getItem as useLocalStorage hook updates slower
    const oldDisplayedData = localStorage.getItem("dashboardDataMessages")

    if (oldDisplayedData) {
      const resetDisplayedDataValues = Object.keys(
        JSON.parse(oldDisplayedData),
      ).map((key) => {
        return { ...JSON.parse(oldDisplayedData)[key], value: 0 }
      })
      setDisplayedData(resetDisplayedDataValues)
    }
  }, [])

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit("set_state", { state: "dashboard" })
      socket.emit("get_home_position")
      socket.emit("get_current_mission")
    }

    socket.on("incoming_msg", (msg) => {
      if (incomingMessageHandler()[msg.mavpackettype] !== undefined) {
        incomingMessageHandler()[msg.mavpackettype](msg)
        // Store packetType that has arrived
        const packetType = msg.mavpackettype

        // Use functional form of setState to ensure the latest state is used
        setDisplayedData((prevDisplayedData) => {
          // Create a copy of displayedData to modify
          let updatedDisplayedData = [...prevDisplayedData]

          // Iterate over displayedData to find and update the matching item
          updatedDisplayedData = updatedDisplayedData.map((dataItem) => {
            if (dataItem.currently_selected.startsWith(packetType)) {
              const specificData = dataItem.currently_selected.split(".")[1]
              if (Object.prototype.hasOwnProperty.call(msg, specificData)) {
                return { ...dataItem, value: msg[specificData] }
              }
            }
            return dataItem
          })

          return updatedDisplayedData
        })
      }
    })

    socket.on("arm_disarm", (msg) => {
      if (!msg.success) {
        showErrorNotification(msg.message)
      }
    })

    socket.on("current_mission", (msg) => {
      setMissionItems(msg)
    })

    socket.on("set_current_flight_mode_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("nav_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("mission_control_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
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
      socket.off("arm_disarm")
      socket.off("current_mission")
      socket.off("set_current_flight_mode_result")
      socket.off("nav_result")
      socket.off("mission_control_result")
      socket.off("home_position_result")
    }
  }, [connected])

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

  useEffect(() => {
    if (!previousHeartbeatData?.base_mode || !heartbeatData?.base_mode) return

    if (
      heartbeatData.base_mode & 128 &&
      !(previousHeartbeatData.base_mode & 128)
    ) {
      playArmed()
    } else if (
      !(heartbeatData.base_mode & 128) &&
      previousHeartbeatData.base_mode & 128
    ) {
      playDisarmed()
    }

    if (currentFlightModeNumber !== heartbeatData.custom_mode) {
      setCurrentFlightModeNumber(heartbeatData.custom_mode)
    }
  }, [heartbeatData])

  function getFlightMode() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[heartbeatData.custom_mode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[heartbeatData.custom_mode]
    }

    return "UNKNOWN"
  }

  function getIsArmed() {
    return heartbeatData.base_mode & 128
  }

  function prearmEnabled() {
    // Checks if prearm check is enabled, if yes then not armable
    // TOOD: test if this returns true if all checks pass
    return Boolean(sysStatusData.onboard_control_sensors_enabled & 268435456)
  }

  function centerMapOnDrone() {
    let lat = parseFloat(gpsData.lat * 1e-7)
    let lon = parseFloat(gpsData.lon * 1e-7)
    mapRef.current.getMap().flyTo({
      center: [lon, lat],
    })
  }

  function calcBigTextFontSize() {
    let w = telemetryPanelSize.width
    const BREAKPOINT_SM = 350.0
    if (w < BREAKPOINT_SM) return 1.0 - (BREAKPOINT_SM - w) / BREAKPOINT_SM
    return 1.0
  }

  function calcIndicatorSize() {
    let sideBarWidth = sideBarRef.current ? sideBarRef.current.clientWidth : 56
    return Math.min(telemetryPanelSize.width - (sideBarWidth + 24) * 2, 190)
  }

  function calcIndicatorPadding() {
    let sideBarHeight = sideBarRef.current
      ? sideBarRef.current.clientHeight
      : 164
    return (190 - Math.max(calcIndicatorSize(), sideBarHeight)) / 2
  }

  let localBatteryData = []

  return (
    <Layout currentPage="dashboard">
      <div className="relative flex flex-auto w-full h-full overflow-hidden">
        <div className="w-full">
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
            mapId="dashboard"
          />
        </div>

        <ResizableInfoBox
          telemetryPanelSize={telemetryPanelSize}
          viewportWidth={viewportWidth}
          setTelemetryPanelSize={setTelemetryPanelSize}
          setTelemetryFontSize={setTelemetryFontSize}
          calcBigTextFontSize={calcBigTextFontSize}
        >
          {/* Telemetry Information */}
          <TelemetrySection
            getIsArmed={getIsArmed}
            prearmEnabled={prearmEnabled}
            calcIndicatorSize={calcIndicatorSize}
            calcIndicatorPadding={calcIndicatorPadding}
            getFlightMode={getFlightMode}
            telemetryData={telemetryData}
            telemetryFontSize={telemetryFontSize}
            attitudeData={attitudeData}
            gpsData={gpsData}
            sideBarRef={sideBarRef}
            navControllerOutputData={navControllerOutputData}
            batteryData={batteryData}
            systemStatus={MAV_STATE[heartbeatData.system_status]}
          />

          <Divider className="my-2" />

          {/* Actions */}
          <TabsSection
            connected={connected}
            aircraftType={aircraftType}
            getIsArmed={getIsArmed}
            currentFlightModeNumber={currentFlightModeNumber}
            currentMissionData={currentMissionData}
            navControllerOutputData={navControllerOutputData}
            displayedData={displayedData}
            setDisplayedData={setDisplayedData}
          />
        </ResizableInfoBox>

        {/* Status Bar */}
        <StatusBar className="absolute top-0 right-0">
          <StatusSection
            icon={<IconRadar />}
            value={GPS_FIX_TYPES[gpsRawIntData.fix_type]}
            tooltip="GPS fix type"
          />
          <StatusSection
            icon={<IconGps />}
            value={`(${gpsData.lat !== undefined ? (gpsData.lat * 1e-7).toFixed(6) : 0}, ${gpsData.lon !== undefined ? (gpsData.lon * 1e-7).toFixed(6) : 0
              })`}
            tooltip="GPS (lat, lon)"
          />
          <StatusSection
            icon={<IconSatellite />}
            value={gpsRawIntData.satellites_visible}
            tooltip="Satellites visible"
          />
          <StatusSection
            icon={<IconAntenna />}
            value={rcChannelsData.rssi}
            tooltip="RC RSSI"
          />
          <StatusSection
            icon={<IconBattery2 />}
            value={
              batteryData[0]?.battery_remaining
                ? `${batteryData[0].battery_remaining}%`
                : "0%"
            }
            tooltip="Battery remaining"
          />
        </StatusBar>

        {/* Right side floating toolbar */}
        <FloatingToolbar
          missionItems={missionItems}
          centerMapOnDrone={centerMapOnDrone}
          gpsData={gpsData}
          followDrone={followDrone}
          setFollowDrone={setFollowDrone}
          mapRef={mapRef}
        />

        {statustextMessages.length !== 0 && (
          <div className="absolute bottom-0 right-0 z-20">
            <ResizableBox
              height={messagesPanelSize.height}
              width={messagesPanelSize.width}
              minConstraints={[600, 150]}
              maxConstraints={[viewportWidth - 200, viewportHeight - 200]}
              resizeHandles={["nw"]}
              handle={(h, ref) => (
                <span className={"custom-handle-nw"} ref={ref} />
              )}
              handleSize={[32, 32]}
              onResize={(_, { size }) => {
                setMessagesPanelSize({ width: size.width, height: size.height })
              }}
            >
              <StatusMessages
                messages={statustextMessages}
                className={`bg-[${tailwindColors.falcongrey["TRANSLUCENT"]}] h-full lucent max-w-1/2 object-fill text-xl`}
              />
            </ResizableBox>
          </div>
        )}
      </div>
    </Layout>
  )
}
