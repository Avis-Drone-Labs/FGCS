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
  IconTarget,
} from "@tabler/icons-react"
import { ResizableBox } from "react-resizable"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice"
import {
  selectAircraftTypeString,
  selectBatteryData,
  selectDroneCoords,
  selectFlightMode,
  selectGPSRawInt,
  selectGPS2RawInt,
  selectNotificationSound,
  selectRSSI,
  soundPlayed,
  selectHasSecondaryGps,
} from "./redux/slices/droneInfoSlice"
import { selectMessages } from "./redux/slices/statusTextSlice"

// Helper javascript files
import { GPS_FIX_TYPES } from "./helpers/mavlinkConstants"

// Custom component
import useSound from "use-sound"
import FloatingToolbar from "./components/dashboard/floatingToolbar"
import MapSection from "./components/dashboard/map"
import ResizableInfoBox from "./components/dashboard/resizableInfoBox"
import StatusBar, { StatusSection } from "./components/dashboard/statusBar"
import StatusMessages from "./components/dashboard/statusMessages"
import TabsSection from "./components/dashboard/tabsSection"
import TelemetrySection from "./components/dashboard/telemetrySection/telemetry"
import VideoWidget from "./components/dashboard/videoWidget"
import Layout from "./components/layout"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Sounds
import armSound from "./assets/sounds/armed.mp3"
import disarmSound from "./assets/sounds/disarmed.mp3"

export default function Dashboard() {
  const dispatch = useDispatch()
  const rssi = useSelector(selectRSSI)

  const currentFlightModeNumber = useSelector(selectFlightMode)
  const aircraftTypeString = useSelector(selectAircraftTypeString)

  const { lat, lon } = useSelector(selectDroneCoords)
  const batteryData = useSelector(selectBatteryData)
  const statustextMessages = useSelector(selectMessages)
  const armedNotification = useSelector(selectNotificationSound)
  const { fixType, satellitesVisible, hdop } = useSelector(selectGPSRawInt)

  const hdopDisplay = hdop != null ? hdop.toFixed(2) : "0.00"

  const connectedToDrone = useSelector(selectConnectedToDrone)
  const gps2 = useSelector(selectGPS2RawInt)
  const hasSecondaryGps = useSelector(selectHasSecondaryGps)

  const secondaryGpsFixLabel = GPS_FIX_TYPES[gps2.fixType];

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
      <div
        className="relative flex flex-auto w-full h-full overflow-hidden"
        data-testid="dashboard"
      >
        <div className="w-full">
          <MapSection
            passedRef={mapRef}
            onDragstart={() => {
              setFollowDrone(false)
            }}
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
            calcIndicatorSize={calcIndicatorSize}
            calcIndicatorPadding={calcIndicatorPadding}
            telemetryFontSize={telemetryFontSize}
            sideBarRef={sideBarRef}
          />

          <Divider className="my-2" />

          {/* Actions */}
          <TabsSection currentFlightModeNumber={currentFlightModeNumber} />
        </ResizableInfoBox>

        {/* Status Bar */}
        <StatusBar className="absolute top-0 right-0">
          <StatusSection
            icon={<IconRadar />}
            value={GPS_FIX_TYPES[fixType]}
            tooltip="GPS fix type"
          />
          {hasSecondaryGps && (
            <StatusSection
              icon={<IconRadar />}
              value={secondaryGpsFixLabel}
              tooltip="GPS2 fix type"
            />
          )}
          <StatusSection
            icon={<IconTarget />}
            value={hdopDisplay}
            tooltip="GPS HDoP"
          />
          <StatusSection
            icon={<IconGps />}
            value={`(${lat !== undefined ? lat.toFixed(7) : 0}, ${
              lon !== undefined ? lon.toFixed(7) : 0
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
          centerMapOnDrone={centerMapOnDrone}
          followDrone={followDrone}
          setFollowDrone={setFollowDrone}
          mapRef={mapRef}
        />

        {/* Video Widget for RTSP streams */}
        <VideoWidget telemetryPanelWidth={telemetryPanelSize.width} />

        <div className="absolute bottom-0 right-0 z-20">
          <ResizableBox
            height={messagesPanelSize.height}
            width={messagesPanelSize.width}
            minConstraints={[600, 150]}
            maxConstraints={[viewportWidth - 200, viewportHeight - 200]}
            resizeHandles={["nw"]}
            handle={(_, ref) => (
              <span className={"custom-handle-nw"} ref={ref} />
            )}
            handleSize={[32, 32]}
            onResize={(_, { size }) => {
              setMessagesPanelSize({ width: size.width, height: size.height })
            }}
          >
            <>
              {/* Show a "Waiting for message area" */}
              {statustextMessages.length == 0 && (
                <StatusMessages
                  messages={[
                    {
                      timestamp: null,
                      text: connectedToDrone
                        ? `Waiting for messages from ${aircraftTypeString}`
                        : "Not connected to drone",
                      severity: 7,
                    },
                  ]}
                  className={`bg-[${tailwindColors.falcongrey["TRANSLUCENT"]}] h-full lucent max-w-1/2 object-fill text-xl`}
                />
              )}
              {/* Show real messages */}
              <StatusMessages
                messages={statustextMessages}
                className={`bg-[${tailwindColors.falcongrey["TRANSLUCENT"]}] h-full lucent max-w-1/2 object-fill text-xl`}
              />
            </>
          </ResizableBox>
        </div>
      </div>
    </Layout>
  )
}
