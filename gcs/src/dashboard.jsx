/*
  The dashboard screen. This is the first screen to be loaded in and is where the user will
  spend most of their time.

  This contains the map, live indicator, and GPS data. All of these are imported as components
  and are integrated in this file with logic linking them together.
*/

// Base imports
import { useCallback, useEffect, useRef, useState } from 'react'

// 3rd Party Imports
import {
  Button,
  Divider,
  Grid,
  NumberInput,
  Popover,
  Select,
  Tabs,
  Tooltip,
} from '@mantine/core'
import {
  useDisclosure,
  useListState,
  useLocalStorage,
  usePrevious,
  useSessionStorage,
  useViewportSize,
} from '@mantine/hooks'
import {
  IconAntenna,
  IconBattery2,
  IconGps,
  IconInfoCircle,
  IconRadar,
  IconSatellite,
} from '@tabler/icons-react'
import { ResizableBox } from 'react-resizable'
import Webcam from 'react-webcam'
// Helper javascript files
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  GPS_FIX_TYPES,
  MAV_AUTOPILOT_INVALID,
  MAV_STATE,
  MISSION_STATES,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from './helpers/mavlinkConstants'
import {
  showErrorNotification,
  showSuccessNotification,
} from './helpers/notification'
import { socket } from './helpers/socket'

// Custom component
import useSound from 'use-sound'
import {
  AttitudeIndicator,
  HeadingIndicator,
} from './components/dashboard/indicator'
import MapSection from './components/dashboard/map'
import StatusBar, { StatusSection } from './components/dashboard/statusBar'
import StatusMessages from './components/dashboard/statusMessages'
import DashboardDataModal from './components/dashboardDataModal'
import FloatingToolbar from './components/dashboard/floatingToolbar'
import Layout from './components/layout'

// Tailwind styling
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Sounds
import armSound from './assets/sounds/armed.mp3'
import disarmSound from './assets/sounds/disarmed.mp3'
import TelemetryValueDisplay from './components/dashboard/telemetryValueDisplay'
import { defaultDataMessages } from './helpers/dashboardDefaultDataMessages'
import { dataFormatters } from './helpers/dataFormatters'

function to2dp(num) {
  // https://stackoverflow.com/questions/4187146/truncate-number-to-two-decimal-places-without-rounding
  return num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
}

const colorPalette = [
  '#36a2eb',
  '#ff6383',
  '#fe9e40',
  '#4ade80',
  '#ffcd57',
  '#4cbfc0',
  '#9966ff',
  '#c8cbce',
]

function DataMessage({ label, value, currentlySelected, id }) {
  let color = colorPalette[id % colorPalette.length]

  var formattedValue = to2dp(value)

  if (currentlySelected in dataFormatters) {
    formattedValue = to2dp(dataFormatters[currentlySelected](value))
  }

  return (
    <Tooltip label={currentlySelected}>
      <div className='flex flex-col items-center justify-center'>
        <p className='text-sm text-center'>{label}</p>
        <p className='text-5xl' style={{ color: color }}>
          {formattedValue}
        </p>
      </div>
    </Tooltip>
  )
}

export default function Dashboard() {
  // Local Storage
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [aircraftType] = useLocalStorage({
    key: 'aircraftType',
  })
  const [outsideVisibility, setOutsideVisibility] = useLocalStorage({
    key: "outsideVisibility",
    defaultValue: false
  })

  // Telemetry panel sizing
  const [telemetryPanelSize, setTelemetryPanelSize] = useLocalStorage({
    key: 'telemetryPanelSize',
    defaultValue: { width: 400, height: Infinity },
    deserialize: (value) => {
      const parsed = JSON.parse(value)
      if (parsed === null || parsed === undefined)
        return { width: 400, height: Infinity }
      return { ...parsed, width: Math.max(parsed['width'], 275) }
    },
  })
  const [telemtryFontSize, setTelemetryFontSize] = useState(
    calcBigTextFontSize(),
  )
  const sideBarRef = useRef()
  const [messagesPanelSize, setMessagesPanelSize] = useLocalStorage({
    key: 'messagesPanelSize',
    defaultValue: { width: 600, height: 150 },
  })

  const { height: viewportHeight, width: viewportWidth } = useViewportSize()

  // Heartbeat data
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })
  const previousHeartbeatData = usePrevious(heartbeatData)

  // System data
  const [batteryData, setBatteryData] = useState({})
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
  const [followDrone, setFollowDrone] = useState(false)
  const [currentFlightModeNumber, setCurrentFlightModeNumber] = useState(null)
  const [newFlightModeNumber, setNewFlightModeNumber] = useState(3) // Default to AUTO mode

  // Map and messages
  const mapRef = useRef()
  var outsideVisibilityColor = outsideVisibility
    ? tailwindColors.falcongrey['900']
    : tailwindColors.falcongrey['TRANSLUCENT']

  // Sounds
  const [playArmed] = useSound(armSound, { volume: 0.1 })
  const [playDisarmed] = useSound(disarmSound, { volume: 0.1 })

  // Camera devices
  const [deviceId, setDeviceId] = useSessionStorage({
    key: 'deviceId',
    defaultValue: null,
  })
  const [devices, setDevices] = useState([])

  // Data Modal Functions
  const [opened, { open, close }] = useDisclosure(false)

  const [displayedData, setDisplayedData] = useLocalStorage({
    key: 'dashboardDataMessages',
    defaultValue: defaultDataMessages,
  })
  const [selectedBox, setSelectedBox] = useState(null)

  const [takeoffAltitude, setTakeoffAltitude] = useLocalStorage({
    key: 'takeoffAltitude',
    defaultValue: 10,
  })

  const handleCheckboxChange = (key, subkey, subvalue, boxId, isChecked) => {
    // Update wantedData on checkbox change
    if (isChecked) {
      const newDisplay = displayedData.map((item, index) => {
        if (index === boxId) {
          return {
            ...item,
            currently_selected: `${key}.${subkey}`,
            display_name: subvalue,
          }
        }
        return item
      })
      setDisplayedData(newDisplay)
      close()
    }
  }

  const handleDoubleClick = (box) => {
    setSelectedBox(box)
    open()
  }

  const incomingMessageHandler = {
    VFR_HUD: (msg) => setTelemetryData(msg),
    BATTERY_STATUS: (msg) => setBatteryData(msg),
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
  }

  const handleDevices = useCallback(
    (mediaDevices) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  useEffect(() => {
    // Use localStorage.getItem as useLocalStorage hook updates slower
    const oldDisplayedData = localStorage.getItem('dashboardDataMessages')

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
      socket.emit('set_state', { state: 'dashboard' })
      socket.emit('get_home_position')
      socket.emit('get_current_mission')
    }

    socket.on('incoming_msg', (msg) => {
      if (incomingMessageHandler[msg.mavpackettype] !== undefined) {
        incomingMessageHandler[msg.mavpackettype](msg)
        // Store packetType that has arrived
        const packetType = msg.mavpackettype

        // Use functional form of setState to ensure the latest state is used
        setDisplayedData((prevDisplayedData) => {
          // Create a copy of displayedData to modify
          let updatedDisplayedData = [...prevDisplayedData]

          // Iterate over displayedData to find and update the matching item
          updatedDisplayedData = updatedDisplayedData.map((dataItem) => {
            if (dataItem.currently_selected.startsWith(packetType)) {
              const specificData = dataItem.currently_selected.split('.')[1]
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

    socket.on('arm_disarm', (msg) => {
      if (!msg.success) {
        showErrorNotification(msg.message)
      }
    })

    socket.on('current_mission', (msg) => {
      setMissionItems(msg)
    })

    socket.on('set_current_flight_mode_result', (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on('nav_result', (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on('mission_control_result', (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on('home_position_result', (data) => {
      if (data.success) {
        setHomePosition(data.data)
      } else {
        showErrorNotification(data.message)
      }
    })

    return () => {
      socket.off('incoming_msg')
      socket.off('arm_disarm')
      socket.off('current_mission')
      socket.off('set_current_flight_mode_result')
      socket.off('nav_result')
      socket.off('mission_control_result')
      socket.off('home_position_result')
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

    return 'UNKNOWN'
  }

  function getFlightModeMap() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP
    }

    return {}
  }

  function getIsArmed() {
    return heartbeatData.base_mode & 128
  }

  function prearmEnabled() {
    // Checks if prearm check is enabled, if yes then not armable
    // TOOD: test if this returns true if all checks pass
    return Boolean(sysStatusData.onboard_control_sensors_enabled & 268435456)
  }

  function armDisarm(arm, force = false) {
    // TODO: Add force arm ability
    socket.emit('arm_disarm', { arm: arm, force: force })
  }

  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    socket.emit('set_current_flight_mode', { newFlightMode: modeNumber })
  }

  function controlMission(action) {
    socket.emit('control_mission', { action })
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

  function centerMapOnFirstMissionItem() {
    if (missionItems.mission_items.length > 0) {
      let lat = parseFloat(missionItems.mission_items[0].x * 1e-7)
      let lon = parseFloat(missionItems.mission_items[0].y * 1e-7)
      mapRef.current.getMap().flyTo({
        center: [lon, lat],
      })
    }
    setFollowDrone(false)
  }

  function updateFollowDroneAction() {
    setFollowDrone(
      followDrone
        ? false
        : (() => {
            if (
              mapRef.current &&
              gpsData?.lon !== 0 &&
              gpsData?.lat !== 0
            ) {
              let lat = parseFloat(gpsData.lat * 1e-7)
              let lon = parseFloat(gpsData.lon * 1e-7)
              mapRef.current.setCenter({ lng: lon, lat: lat })
            }
            return true
          })(),
    )
  }

  function takeoff() {
    socket.emit('takeoff', { alt: takeoffAltitude })
  }

  function land() {
    socket.emit('land')
  }

  return (
    <Layout currentPage='dashboard'>
      <div className='relative flex flex-auto w-full h-full overflow-hidden'>
        <div className='w-full'>
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
          />
        </div>

        <div
          className='absolute top-0 left-0 h-full z-10'
          style={{ backgroundColor: outsideVisibilityColor }}
        >
          <ResizableBox
            height={telemetryPanelSize.height}
            width={telemetryPanelSize.width}
            minConstraints={[275, Infinity]}
            maxConstraints={[viewportWidth - 200, Infinity]}
            resizeHandles={['e']}
            handle={(h, ref) => (
              <span className={`custom-handle-e`} ref={ref} />
            )}
            handleSize={[32, 32]}
            axis='x'
            onResize={(_, { size }) => {
              setTelemetryPanelSize({ width: size.width, height: size.height })
              setTelemetryFontSize(calcBigTextFontSize())
            }}
            className='h-full'
          >
            <div className='@container flex flex-col px-6 py-2 h-full gap-2 overflow-x-hidden overflow-y-auto'>
              {/* Telemetry Information */}
              <div>
                {/* Information above indicators */}
                <div className='flex flex-col items-center space-y-2'>
                  {getIsArmed() ? (
                    <p className='font-bold text-falconred'>ARMED</p>
                  ) : (
                    <>
                      <p className='font-bold'>DISARMED</p>
                      {prearmEnabled() ? (
                        <p className='text-green-500'>Prearm: Enabled</p>
                      ) : (
                        <p className='font-bold text-falconred'>
                          Prearm: Disabled
                        </p>
                      )}
                    </>
                  )}
                  <div className='flex flex-row space-x-6'>
                    <p>{MAV_STATE[heartbeatData.system_status]}</p>
                    <p>{getFlightMode()}</p>
                  </div>
                </div>

                <div className='flex items-center flex-col justify-center justify-evenly @xl:flex-row'>
                  {/* Attitude Indicator */}
                  <div
                    className='flex flex-row items-center justify-center'
                    style={{
                      paddingTop: `${calcIndicatorPadding()}px`,
                      paddingBottom: `${calcIndicatorPadding()}px`,
                    }}
                  >
                    <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
                      <p className='text-sm text-center'>ms&#8315;&#185;</p>
                      <TelemetryValueDisplay
                        title='AS'
                        value={(telemetryData.airspeed
                          ? telemetryData.airspeed
                          : 0
                        ).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                      <TelemetryValueDisplay
                        title='GS'
                        value={(telemetryData.groundspeed
                          ? telemetryData.groundspeed
                          : 0
                        ).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                    </div>
                    <AttitudeIndicator
                      roll={attitudeData.roll * (180 / Math.PI)}
                      pitch={attitudeData.pitch * (180 / Math.PI)}
                      size={`${calcIndicatorSize()}px`}
                    />
                    <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
                      <p className='text-sm text-center'>m</p>
                      <TelemetryValueDisplay
                        title='AMSL'
                        value={(gpsData.alt ? gpsData.alt / 1000 : 0).toFixed(
                          2,
                        )}
                        fs={telemtryFontSize}
                      />
                      <TelemetryValueDisplay
                        title='AREL'
                        value={(gpsData.relative_alt
                          ? gpsData.relative_alt / 1000
                          : 0
                        ).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                    </div>
                  </div>

                  {/* Heading Indicator */}
                  <div
                    className='flex flex-row items-center justify-center'
                    style={{
                      paddingTop: `${calcIndicatorPadding()}px`,
                      paddingBottom: `${calcIndicatorPadding()}px`,
                    }}
                  >
                    <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
                      <p className='text-sm text-center'>deg &#176;</p>
                      <TelemetryValueDisplay
                        title='HDG'
                        value={(gpsData.hdg ? gpsData.hdg / 100 : 0).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                      <TelemetryValueDisplay
                        title='YAW'
                        value={(attitudeData.yaw
                          ? attitudeData.yaw * (180 / Math.PI)
                          : 0
                        ).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                    </div>
                    <HeadingIndicator
                      heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
                      size={`${calcIndicatorSize()}px`}
                    />
                    <div
                      className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'
                      ref={sideBarRef}
                    >
                      <p className='text-sm'>m</p>
                      <TelemetryValueDisplay
                        title='WP'
                        value={(navControllerOutputData.wp_dist
                          ? navControllerOutputData.wp_dist
                          : 0
                        ).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                      {/* TOOD: Implement distance to home */}
                      <TelemetryValueDisplay
                        title='HOME'
                        value={(0).toFixed(2)}
                        fs={telemtryFontSize}
                      />
                    </div>
                  </div>
                </div>

                {/* Batter information */}
                <div className='flex flex-col items-center'>
                  <p>BATTERY</p>
                  <div className='flex flex-row space-x-4'>
                    <p className='font-bold text-xl'>
                      {(batteryData.voltages
                        ? batteryData.voltages[0] / 1000
                        : 0
                      ).toFixed(2)}
                      V
                    </p>
                    <p className='font-bold text-xl'>
                      {(batteryData.current_battery
                        ? batteryData.current_battery / 100
                        : 0
                      ).toFixed(2)}
                      A
                    </p>
                    <p className='font-bold text-xl'>
                      {batteryData.battery_remaining
                        ? batteryData.battery_remaining
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              <Divider className='my-2' />

              <Tabs defaultValue='data'>
                <Tabs.List grow>
                  <Tabs.Tab value='data'>Data</Tabs.Tab>
                  <Tabs.Tab value='actions'>Actions</Tabs.Tab>
                  <Tabs.Tab value='mission'>Mission</Tabs.Tab>
                  <Tabs.Tab value='camera'>Camera</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value='data'>
                  <>
                    <Grid className='cursor-pointer select-none mt-2'>
                      {displayedData.length > 0 ? (
                        displayedData.map((data) => (
                          <Grid.Col
                            span={6}
                            key={data.boxId}
                            onDoubleClick={() => handleDoubleClick(data)} // Pass boxId to the function
                          >
                            <DataMessage
                              label={data.display_name}
                              value={data.value}
                              currentlySelected={data.currently_selected}
                              id={data.boxId}
                            />
                          </Grid.Col>
                        ))
                      ) : (
                        <div className='flex justify-center items-center p-4'>
                          <IconInfoCircle size={20} />
                          <p className='ml-2'>Double Click to select data</p>
                        </div>
                      )}
                    </Grid>
                    <DashboardDataModal
                      opened={opened}
                      close={close}
                      selectedBox={selectedBox}
                      handleCheckboxChange={handleCheckboxChange}
                    />
                  </>
                </Tabs.Panel>

                <Tabs.Panel value='actions'>
                  {/* Arming/Flight Modes */}
                  {!connected ? (
                    <div className='flex flex-col items-center justify-center h-full'>
                      <p className='text-white-800 p-6 text-center'>
                        No actions are available right now. Connect a drone to
                        begin
                      </p>
                    </div>
                  ) : (
                    <div className='flex flex-col flex-wrap gap-4 mt-4'>
                      <div className='flex flex-row space-x-14'>
                        <Button
                          onClick={() => {
                            armDisarm(!getIsArmed())
                          }}
                        >
                          {getIsArmed() ? 'Disarm' : 'Arm'}
                        </Button>
                      </div>
                      <div className='flex flex-row space-x-2'>
                        {currentFlightModeNumber !== null && (
                          <>
                            <Select
                              value={newFlightModeNumber.toString()}
                              onChange={(value) => {
                                setNewFlightModeNumber(parseInt(value))
                              }}
                              data={Object.keys(getFlightModeMap()).map(
                                (key) => {
                                  return {
                                    value: key,
                                    label: getFlightModeMap()[key],
                                  }
                                },
                              )}
                            />
                            <Button
                              onClick={() =>
                                setNewFlightMode(newFlightModeNumber)
                              }
                            >
                              Set flight mode
                            </Button>
                          </>
                        )}
                      </div>
                      <div className='flex flex-row space-x-2'>
                        <Popover
                          width={200}
                          position='bottom'
                          withArrow
                          shadow='md'
                        >
                          <Popover.Target>
                            <Button>Takeoff</Button>
                          </Popover.Target>
                          <Popover.Dropdown className='flex flex-col space-y-2'>
                            <NumberInput
                              label='Takeoff altitude (m)'
                              placeholder='Takeoff altitude (m)'
                              value={takeoffAltitude}
                              onChange={setTakeoffAltitude}
                              min={0}
                              allowNegative={false}
                              hideControls
                            />
                            <Button
                              onClick={() => {
                                takeoff()
                              }}
                            >
                              Takeoff
                            </Button>
                          </Popover.Dropdown>
                        </Popover>
                        <Button
                          onClick={() => {
                            land()
                          }}
                        >
                          Land
                        </Button>
                      </div>
                    </div>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value='mission'>
                  {!connected ? (
                    <div className='flex flex-col items-center justify-center h-full'>
                      <p className='text-white-800 p-6 text-center'>
                        No mission actions are available right now. Connect a
                        drone to begin
                      </p>
                    </div>
                  ) : (
                    <div className='flex flex-col flex-wrap gap-4 mt-4'>
                      <div className='flex flex-col text-xl'>
                        <p>
                          Mission state:{' '}
                          {MISSION_STATES[currentMissionData.mission_state]}
                        </p>
                        <p>
                          Waypoint: {currentMissionData.seq}/
                          {currentMissionData.total}
                        </p>
                        <p>
                          Distance to WP:{' '}
                          {(navControllerOutputData.wp_dist
                            ? navControllerOutputData.wp_dist
                            : 0
                          ).toFixed(2)}
                          m
                        </p>
                      </div>
                      <div className='flex flex-row space-x-14'>
                        <Button
                          onClick={() => {
                            setNewFlightMode(
                              parseInt(
                                Object.keys(getFlightModeMap()).find(
                                  (key) => getFlightModeMap()[key] === 'Auto',
                                ),
                              ),
                            )
                          }}
                        >
                          Auto mode
                        </Button>
                      </div>
                      <div className='flex flex-row space-x-14'>
                        <Button
                          onClick={() => {
                            controlMission('start')
                          }}
                        >
                          Start mission
                        </Button>
                      </div>
                      <div className='flex flex-row space-x-14'>
                        <Button
                          onClick={() => {
                            controlMission('restart')
                          }}
                        >
                          Restart mission
                        </Button>
                      </div>
                    </div>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value='camera'>
                  <div className='flex flex-col gap-4 mt-2'>
                    <Select
                      label='Select camera input'
                      data={devices.map((device) => {
                        return { value: device.deviceId, label: device.label }
                      })}
                      value={deviceId}
                      onChange={setDeviceId}
                    />
                    {deviceId !== null && (
                      <Webcam
                        audio={false}
                        videoConstraints={{ deviceId: deviceId }}
                      />
                    )}
                  </div>
                </Tabs.Panel>
              </Tabs>
            </div>
          </ResizableBox>
        </div>

        {/* Status Bar */}
        <StatusBar
          className='absolute top-0 right-0'
          outsideVisibilityColor={outsideVisibilityColor}
        >
          <StatusSection
            icon={<IconRadar />}
            value={GPS_FIX_TYPES[gpsRawIntData.fix_type]}
            tooltip='GPS fix type'
          />
          <StatusSection
            icon={<IconGps />}
            value={`(${gpsData.lat !== undefined ? (gpsData.lat * 1e-7).toFixed(6) : 0}, ${
              gpsData.lon !== undefined ? (gpsData.lon * 1e-7).toFixed(6) : 0
            })`}
            tooltip='GPS (lat, lon)'
          />
          <StatusSection
            icon={<IconSatellite />}
            value={gpsRawIntData.satellites_visible}
            tooltip='Satellites visible'
          />
          <StatusSection
            icon={<IconAntenna />}
            value={rcChannelsData.rssi}
            tooltip='RC RSSI'
          />
          <StatusSection
            icon={<IconBattery2 />}
            value={
              batteryData.battery_remaining
                ? `${batteryData.battery_remaining}%`
                : '0%'
            }
            tooltip='Battery remaining'
          />
        </StatusBar>

        {/* Right side floating toolbar */}
        <FloatingToolbar 
          outsideVisibilityColor={outsideVisibilityColor}
          centerMapOnFirstMissionItem={centerMapOnFirstMissionItem}
          missionItems={missionItems}
          centerMapOnDrone={centerMapOnDrone}
          gpsData={gpsData}
          followDrone={followDrone}
          updateFollowDroneAction={updateFollowDroneAction}
        />

        {statustextMessages.length !== 0 && (
          <div className='absolute bottom-0 right-0 z-20'>
            <ResizableBox
              height={messagesPanelSize.height}
              width={messagesPanelSize.width}
              minConstraints={[600, 150]}
              maxConstraints={[viewportWidth - 200, viewportHeight - 200]}
              resizeHandles={['nw']}
              handle={(h, ref) => (
                <span className={`custom-handle-nw`} ref={ref} />
              )}
              handleSize={[32, 32]}
              onResize={(_, { size }) => {
                setMessagesPanelSize({ width: size.width, height: size.height })
              }}
            >
              <StatusMessages
                messages={statustextMessages}
                outsideVisibility={outsideVisibility}
                className={`bg-[${tailwindColors.falcongrey['TRANSLUCENT']}] h-full lucent max-w-1/2 object-fill text-xl`}
              />
            </ResizableBox>
          </div>
        )}
      </div>
    </Layout>
  )
}
