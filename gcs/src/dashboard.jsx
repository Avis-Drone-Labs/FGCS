/*
  The dashboard screen. This is the first screen to be loaded in and is where the user will
  spend most of their time.

  This contains the map, live indicator, and GPS data. All of these are imported as components
  and are integrated in this file with logic linking them together.
*/

// Base imports
import { useEffect, useRef, useState } from 'react'

// 3rd Party Imports
import {
  ActionIcon,
  Button,
  Divider,
  Select,
  Tabs,
  Tooltip,
  Grid,
} from '@mantine/core'
import {
  useDisclosure,
  useListState,
  useLocalStorage,
  usePrevious,
  useViewportSize,
} from '@mantine/hooks'
import {
  IconAnchor,
  IconAnchorOff,
  IconAntenna,
  IconBattery2,
  IconCrosshair,
  IconGps,
  IconRadar,
  IconSatellite,
  IconSun,
  IconSunOff,
} from '@tabler/icons-react'
import { ResizableBox } from 'react-resizable'

// Helper javascript files
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  GPS_FIX_TYPES,
  MAV_AUTOPILOT_INVALID,
  MAV_STATE,
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
import Layout from './components/layout'
import DashboardDataModal from './components/dashboardDataModal'

// Sounds
import armSound from './assets/sounds/armed.mp3'
import disarmSound from './assets/sounds/disarmed.mp3'
import TelemetryValueDisplay from './components/dashboard/telemetryValueDisplay'

function DataMessage({ label, temp }) {
  let color = 'white'
  // Convert temp to a fixed 2 decimal places
  const formattedTemp = temp.toFixed(2);
  
  return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-base">
          {label}
        </p>
        <p className="text-2xl" style={{ color: color }}>
          {formattedTemp}
        </p>
      </div>
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
  const [telemetryPanelSize, setTelemetryPanelSize] = useLocalStorage({
    key: 'telemetryPanelSize',
    defaultValue: { width: 400, height: Infinity },
  })
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

  // Mission
  const [missionItems, setMissionItems] = useState({
    mission_items: [],
    fence_items: [],
    rally_items: [],
  })

  // Following Drone
  const [followDrone, setFollowDrone] = useState(false)
  const [currentFlightModeNumber, setCurrentFlightModeNumber] = useState(null)
  const [newFlightModeNumber, setNewFlightModeNumber] = useState(3) // Default to AUTO mode

  // Map and messages
  const mapRef = useRef()
  const [outsideVisibility, setOutsideVisibility] = useState(false)

  // Sounds
  const [playArmed] = useSound(armSound, { volume: 0.1 })
  const [playDisarmed] = useSound(disarmSound, { volume: 0.1 })

  // Incoming messages
  const [possibleData, setPossibleData] = useState({})
  const [collectedKeys, setCollectedKeys] = useState(); 
  
  const [incomingMsg, setIncomingMessage] = useState({}); 

  // Data Modal
  const [opened, { open, close }] = useDisclosure(false)
  const [displayedData, setDisplayedData] = useState(incomingMsg); // sample
  const [checkboxStates, setCheckboxStates] = useState({})
  const handleCheckboxChange = (index, isChecked) => {
    setCheckboxStates(prev => ({ ...prev, [index]: isChecked }));
  }
  const filterDisplayedData = (selectedItems) => {
    const filteredData = Object.keys(incomingMsg)
      .filter(key => selectedItems.includes(key))
      .reduce((obj, key) => {
        obj[key] = incomingMsg[key];
        return obj;
      }, {});
    setDisplayedData(filteredData);
  }

  const handleConfirm = () => {
    const selectedItems = collectedKeys.filter((_, index) => checkboxStates[index]);
    filterDisplayedData(selectedItems);
    close();
  }

  const handleDoubleClick = () => {
    open();
  };

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
  }

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit('set_state', { state: 'dashboard' })
      socket.emit('get_current_mission')
    }

    socket.on('incoming_msg', (msg) => {
      if (incomingMessageHandler[msg.mavpackettype] !== undefined) {
        incomingMessageHandler[msg.mavpackettype](msg)
        // Check if the mavpackettype of the message is not already in possibleData
        if(!(msg.mavpackettype in possibleData)){
          // Collect keys from msg, excluding 'mavpackettype' and 'timestamp'
          const keys = Object.keys(msg).filter(key => key !== 'mavpackettype' && key !== 'timestamp');
          // Update the collectedKeys array with these keys
          setCollectedKeys(prevKeys => [...new Set([...prevKeys, ...keys])]); // To Ensure uniqueness
          // Update possibleData with {msg.mavpackettype: [array of keys in msg except mavpackettype and timestamp]}
          setPossibleData(prevData => ({...prevData, [msg.mavpackettype]: keys}));
          // Store the key and value
          setIncomingMessage(prevData => ({
            ...prevData,
            ...Object.keys(msg)
              .filter(key => key !== 'mavpackettype' && key !== 'timestamp')
              .reduce((obj, key) => {
                obj[key] = msg[key]; 
                return obj;
              }, {})
          }));
        }
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

    return () => {
      socket.off('incoming_msg')
      socket.off('arm_disarm')
      socket.off('current_mission')
      socket.off('set_current_flight_mode_result')
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

  function centerMapOnDrone() {
    let lat = parseFloat(gpsData.lat * 1e-7)
    let lon = parseFloat(gpsData.lon * 1e-7)
    mapRef.current.getMap().flyTo({
      center: [lon, lat],
    })
  }

  return (
    <Layout currentPage='dashboard'>
      <div className='relative flex flex-auto w-full h-full overflow-hidden'>
        <div className='w-full'>
          <MapSection
            passedRef={mapRef}
            data={gpsData}
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
            missionItems={missionItems}
          />
        </div>

        <div
          className='absolute top-0 left-0 h-full z-10'
          style={{
            backgroundColor: outsideVisibility
              ? 'rgb(28 32 33)'
              : 'rgb(28 32 33 / 0.8)',
          }}
        >
          <ResizableBox
            height={telemetryPanelSize.height}
            width={telemetryPanelSize.width}
            minConstraints={[200, Infinity]}
            maxConstraints={[viewportWidth - 200, Infinity]}
            resizeHandles={['e']}
            handle={(h, ref) => (
              <span className={`custom-handle-e`} ref={ref} />
            )}
            handleSize={[32, 32]}
            axis='x'
            onResize={(_, { size }) => {
              setTelemetryPanelSize({ width: size.width, height: size.height })
            }}
            className='h-full'
          >
            <div className='flex flex-col p-2 h-full gap-2'>
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

                {/* Attitude Indicator */}
                <div className='flex flex-row items-center justify-center'>
                  <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
                    <p className='text-sm'>ms&#8315;&#185;</p>
                    <TelemetryValueDisplay
                      title='AS'
                      value={(telemetryData.airspeed
                        ? telemetryData.airspeed
                        : 0
                      ).toFixed(2)}
                    />
                    <TelemetryValueDisplay
                      title='GS'
                      value={(telemetryData.groundspeed
                        ? telemetryData.groundspeed
                        : 0
                      ).toFixed(2)}
                    />
                  </div>
                  <AttitudeIndicator
                    roll={attitudeData.roll * (180 / Math.PI)}
                    pitch={attitudeData.pitch * (180 / Math.PI)}
                    size={'20vmin'}
                  />
                  <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
                    <p className='text-sm'>m</p>
                    <TelemetryValueDisplay
                      title='AMSL'
                      value={(gpsData.alt ? gpsData.alt / 1000 : 0).toFixed(2)}
                    />
                    <TelemetryValueDisplay
                      title='AREL'
                      value={(gpsData.relative_alt
                        ? gpsData.relative_alt / 1000
                        : 0
                      ).toFixed(2)}
                    />
                  </div>
                </div>

                {/* Heading Indicator */}
                <div className='flex flex-row items-center justify-center'>
                  <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
                    <p className='text-sm'>deg &#176;</p>
                    <TelemetryValueDisplay
                      title='HDG'
                      value={(gpsData.hdg ? gpsData.hdg / 100 : 0).toFixed(2)}
                    />
                    <TelemetryValueDisplay
                      title='YAW'
                      value={(attitudeData.yaw
                        ? attitudeData.yaw * (180 / Math.PI)
                        : 0
                      ).toFixed(2)}
                    />
                  </div>
                  <HeadingIndicator
                    heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
                    size={'20vmin'}
                  />
                  <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
                    <p className='text-sm'>m</p>
                    <TelemetryValueDisplay
                      title='WP'
                      value={(navControllerOutputData.wp_dist
                        ? navControllerOutputData.wp_dist
                        : 0
                      ).toFixed(2)}
                    />
                    {/* TOOD: Implement distance to home */}
                    <TelemetryValueDisplay
                      title='HOME'
                      value={(0).toFixed(2)}
                    />
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
                <Tabs.List>
                  <Tabs.Tab value='data'>Data</Tabs.Tab>
                  <Tabs.Tab value='actions'>Actions</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value='data'> 
                  <div>
                  <Tooltip label="Double Click to select data">
                    <Grid onDoubleClick={handleDoubleClick}>
                      {Object.entries(displayedData).map(([key, value], i) => (
                        <Grid.Col span={3} key={i}>
                          <DataMessage label={key} temp={value} />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Tooltip>
                  <DashboardDataModal 
                    opened={opened} 
                    close={close} 
                    possibleData={collectedKeys}
                    handleCheckboxChange={handleCheckboxChange}
                    handleConfirm={handleConfirm}
                    checkboxStates={checkboxStates}
                    />
                  </div>
                </Tabs.Panel>

                <Tabs.Panel value='actions'>
                  {/* Arming/Flight Modes */}
                  {connected && (
                    <div className='flex flex-col flex-wrap gap-4'>
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
                    </div>
                  )}
                </Tabs.Panel>
              </Tabs>
            </div>
          </ResizableBox>
        </div>

        {/* Status Bar */}
        <StatusBar className='absolute top-0 right-0'>
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
        <div className='absolute right-0 top-1/2 bg-falcongrey/80 py-4 px-2 rounded-tl-md rounded-bl-md flex flex-col gap-2 z-30'>
          {/* Follow Drone */}
          <Tooltip
            label={
              !gpsData.lon && !gpsData.lat
                ? 'No GPS data'
                : followDrone
                  ? 'Stop following'
                  : 'Follow drone'
            }
          >
            <ActionIcon
              disabled={!gpsData.lon && !gpsData.lat}
              onClick={() => {
                setFollowDrone(!followDrone)
              }}
            >
              {followDrone ? <IconAnchorOff /> : <IconAnchor />}
            </ActionIcon>
          </Tooltip>

          {/* Center Map on Drone */}
          <Tooltip
            label={
              !gpsData.lon && !gpsData.lat ? 'No GPS data' : 'Center on drone'
            }
          >
            <ActionIcon
              disabled={!gpsData.lon && !gpsData.lat}
              onClick={centerMapOnDrone}
            >
              <IconCrosshair />
            </ActionIcon>
          </Tooltip>

          {/* Set outside visibility */}
          <Tooltip
            label={
              outsideVisibility
                ? 'Turn off outside text mode'
                : 'Turn on outside text mode'
            }
          >
            <ActionIcon
              onClick={() => {
                setOutsideVisibility(!outsideVisibility)
              }}
            >
              {outsideVisibility ? <IconSun /> : <IconSunOff />}
            </ActionIcon>
          </Tooltip>
        </div>

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
                className='h-full bg-falcongrey/80 max-w-1/2 object-fill text-xl'
              />
            </ResizableBox>
          </div>
        )}
      </div>
    </Layout>
  )
}
