/*
  The dashboard screen. This is the first screen to be loaded in and is where the user will
  spend most of their time.

  This contains the map, live indicator, and GPS data. All of these are imported as components
  and are integrated in this file with logic linking them together.
*/

// Base imports
import { useEffect, useRef, useState } from "react"

// 3rd Party Imports
import { Divider } from "@mantine/core"
import {
  useLocalStorage,
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

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  selectAttitude,
  selectBatteryData,
  selectDroneCoords,
  selectFlightMode,
  selectGPS,
  selectGPSRawInt,
  selectHeartbeat,
  selectNavController,
  selectNotificationSound,
  selectPrearmEnabled,
  selectRSSI,
  selectTelemetry,
  soundPlayed,
} from "./redux/slices/droneInfoSlice"
import { selectMessages } from "./redux/slices/statusTextSlice"
import {
  notificationShown,
  selectNotificationQueue,
} from "./redux/slices/notificationSlice"

// Helper javascript files
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  GPS_FIX_TYPES,
  MAV_STATE,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "./helpers/mavlinkConstants"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification"

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
// import { AlertCategory, AlertSeverity } from "./components/dashboard/alert"
// import { useAlerts } from "./components/dashboard/alertProvider"
// import { useSettings } from "./helpers/settings"
import {
  selectCurrentMissionItems,
  selectHomePosition,
} from "./redux/slices/missionSlice"

export default function Dashboard() {
  const gpsData = useSelector(selectGPS)
  const telemetryData = useSelector(selectTelemetry)
  const navControllerOutputData = useSelector(selectNavController)
  const prearmEnabled = useSelector(selectPrearmEnabled)
  const rssi = useSelector(selectRSSI)
  const heartbeatData = useSelector(selectHeartbeat)

  const missionItems = useSelector(selectCurrentMissionItems)
  const homePosition = useSelector(selectHomePosition)
  const currentFlightModeNumber = useSelector(selectFlightMode)

  const attitudeData = useSelector(selectAttitude)
  const { lat, lon } = useSelector(selectDroneCoords)
  const batteryData = useSelector(selectBatteryData)
  const statustextMessages = useSelector(selectMessages)
  const armedNotification = useSelector(selectNotificationSound)
  const notificationQueue = useSelector(selectNotificationQueue)
  const { fixType, satellitesVisible } = useSelector(selectGPSRawInt)
  const dispatch = useDispatch()

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

  // Following Drone
  const [followDrone, setFollowDrone] = useSessionStorage({
    key: "followDroneBool",
    defaultValue: false,
  })

  // Map and messages
  const mapRef = useRef()

  // Sounds
  const [playArmed] = useSound(armSound, { volume: 0.1 })
  const [playDisarmed] = useSound(disarmSound, { volume: 0.1 })

  // Play queued arming sounds
  useEffect(() => {
    if (armedNotification !== "") {
      armedNotification === "armed" ? playArmed() : playDisarmed()
      dispatch(soundPlayed())
    }
  }, [armedNotification, playArmed, playDisarmed, dispatch])

  // Show queued notifications
  useEffect(() => {
    if (notificationQueue.length !== 0) {
      ;(notificationQueue[0].type === "error"
        ? showErrorNotification
        : showSuccessNotification)(notificationQueue[0].message)
      dispatch(notificationShown())
    }
  }, [notificationQueue, dispatch])

  // Following drone logic
  useEffect(() => {
    if (mapRef.current && followDrone && lon !== 0 && lat !== 0) {
      mapRef.current.setCenter({ lng: lon, lat: lat })
    }
  }, [followDrone, lon, lat])

  function centerMapOnDrone() {
    mapRef.current.getMap().flyTo({
      center: [lon, lat],
    })
  }

  // NEED TO FIX THIS BEFORE WE MERGE KUSH/BEN
  // Alerts
  // const { getSetting } = useSettings()
  // const { dispatchAlert, dismissAlert } = useAlerts()
  // const highestAltitudeRef = useRef(0)

  // function updateAltitudeAlert(msg) {
  //   if (msg.alt > highestAltitudeRef.current)
  //     return (highestAltitudeRef.current = msg.alt)
  //   const altitudes = getSetting("Dashboard.altitudeAlerts")
  //   altitudes.sort((a1, a2) => a1 - a2)

  //   for (const [i, altitude] of altitudes.entries()) {
  //     if (highestAltitudeRef.current > altitude && msg.alt < altitude) {
  //       dispatchAlert({
  //         category: AlertCategory.Altitude,
  //         severity:
  //           i == 0
  //             ? AlertSeverity.Red
  //             : i == altitudes.length - 1
  //               ? AlertSeverity.Yellow
  //               : AlertSeverity.Orange,
  //         jsx: <>Caution! You've fallen below {altitude}m</>,
  //       })
  //       return
  //     }
  //   }

  //   dismissAlert(AlertCategory.Altitude)
  // }

  function getFlightMode() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP[heartbeatData.customMode]
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP[heartbeatData.customMode]
    }

    return "UNKNOWN"
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

  return (
    <Layout currentPage="dashboard">
      <div className="relative flex flex-auto w-full h-full overflow-hidden">
        <div className="w-full">
          <MapSection
            passedRef={mapRef}
            data={gpsData}
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
            desiredBearing={navControllerOutputData.navBearing}
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
            systemStatus={MAV_STATE[heartbeatData.systemStatus]}
          />

          <Divider className="my-2" />

          {/* Actions */}
          <TabsSection
            connected={connected}
            aircraftType={aircraftType}
            currentFlightModeNumber={currentFlightModeNumber}
            navControllerOutputData={navControllerOutputData}
          />
        </ResizableInfoBox>

        {/* Status Bar */}
        <StatusBar className="absolute top-0 right-0">
          <StatusSection
            icon={<IconRadar />}
            value={GPS_FIX_TYPES[fixType]}
            tooltip="GPS fix type"
          />
          <StatusSection
            icon={<IconGps />}
            value={`(${lat !== undefined ? lat.toFixed(6) : 0}, ${
              lon !== undefined ? lon.toFixed(6) : 0
            })`}
            tooltip="GPS (lat, lon)"
          />
          <StatusSection
            icon={<IconSatellite />}
            value={satellitesVisible}
            tooltip="Satellites visible"
          />
          <StatusSection
            icon={<IconAntenna />}
            value={rssi}
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
