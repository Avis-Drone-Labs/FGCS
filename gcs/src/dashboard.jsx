/*
  The dashboard screen. This is the first screen to be loaded in and is where the user will spend most of their time.

  This contains the map, live indicator, and GPS data. All of these are imported as components and are integrated in this file with logic linking them together.
*/

// Base imports
import { useEffect, useRef, useState } from 'react'

// 3rd Party Imports
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { useListState, useLocalStorage } from '@mantine/hooks'
import {
  IconAnchor,
  IconAnchorOff,
  IconAntenna,
  IconBattery2,
  IconGps,
  IconRadar,
  IconSatellite,
} from '@tabler/icons-react'

// Helper javascript files
import { COPTER_MODES, GPS_FIX_TYPES, MAV_STATE, PLANE_MODES } from './helpers/mavlinkConstants'
import { showErrorNotification } from './helpers/notification'
import { socket } from './helpers/socket'

// Custom component
import { AttitudeIndicator, HeadingIndicator } from './components/indicator'
import Layout from './components/layout'
import MapSection from './components/map'
import StatusBar, { StatusSection } from './components/statusBar'
import StatusMessages from './components/statusMessages'

const MAV_AUTOPILOT_INVALID = 8

export default function Dashboard() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [telemetryData, setTelemetryData] = useState({})
  const [gpsData, setGpsData] = useState({})
  const [attitudeData, setAttitudeData] = useState({ roll: 0, pitch: 0 })
  const [navControllerOutputData, setNavControllerOutputData] = useState({})
  const [batteryData, setBatteryData] = useState({})
  const [heartbeatData, setHeartbeatData] = useState({ system_status: 0 })
  const [statustextMessages, statustextMessagesHandler] = useListState([])
  const [sysStatusData, setSysStatusData] = useState({
    onboard_control_sensors_enabled: 0,
  })
  const [gpsRawIntData, setGpsRawIntData] = useState({
    fix_type: 0,
    satellites_visible: 0,
  })
  const [rcChannelsData, setRCChannelsData] = useState({ rssi: 0 })

  const [followDrone, setFollowDrone] = useState(false)
  const mapRef = useRef()

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
      statustextMessagesHandler.setState([])
    }

    socket.on('incoming_msg', (msg) => {
      if (incomingMessageHandler[msg.mavpackettype] !== undefined) {
        incomingMessageHandler[msg.mavpackettype](msg)
      }
    })

    socket.on('arm_disarm', (msg) => {
      console.log(msg)
      if (!msg.success) {
        showErrorNotification(msg.message)
      }
    })

    return () => {
      socket.off('incoming_msg')
      socket.off('arm_disarm')
    }
  }, [connected])

  // Following drone logic
  useEffect(() => {
    if (mapRef.current && !gpsData.lon && !gpsData.lat && followDrone) {
      let lat = gpsData.lat * 1e-7
      let lon = gpsData.lon * 1e-7
      mapRef.current.setCenter({ lng: lon, lat: lat })
    }
  }, [gpsData])

  function getFlightMode() {
    if (!heartbeatData.type) {
      return 'UNKNOWN'
    } else if (heartbeatData.type === 1) {
      return PLANE_MODES[heartbeatData.custom_mode]
    } else if (heartbeatData.type === 2) {
      return COPTER_MODES[heartbeatData.custom_mode]
    }

    return 'UNKNOWN'
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

  return (
    <Layout currentPage='dashboard'>
      <div className='relative flex flex-auto w-full h-full'>
        <div className='w-full'>
          <MapSection
            data={gpsData}
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
            passedRef={mapRef}
          />
        </div>
        <div className='absolute top-0 left-0 p-4 bg-falcongrey/80'>
          <div className='flex flex-col items-center space-y-2'>
            {getIsArmed() ? (
              <p className='font-bold text-falconred'>ARMED</p>
            ) : (
              <>
                <p className='font-bold'>DISARMED</p>
                {prearmEnabled() ? (
                  <p className='text-green-500'>Prearm: Enabled</p>
                ) : (
                  <p className='font-bold text-falconred'>Prearm: Disabled</p>
                )}
              </>
            )}
            <div className='flex flex-row space-x-6'>
              <p>{MAV_STATE[heartbeatData.system_status]}</p>
              <p>{getFlightMode()}</p>
            </div>
          </div>
          <div className='flex flex-row items-center justify-center'>
            <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
              <p className='text-sm'>ms&#8315;&#185;</p>
              <p>
                AS <br /> {(telemetryData.airspeed ? telemetryData.airspeed : 0).toFixed(2)}
              </p>
              <p>
                GS <br /> {(telemetryData.groundspeed ? telemetryData.groundspeed : 0).toFixed(2)}
              </p>
            </div>
            <AttitudeIndicator
              roll={attitudeData.roll * (180 / Math.PI)}
              pitch={attitudeData.pitch * (180 / Math.PI)}
            />
            <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
              <p className='text-sm'>m</p>
              <p>
                AMSL <br /> {(gpsData.alt ? gpsData.alt / 1000 : 0).toFixed(2)}
              </p>
              <p>
                AREL <br /> {(gpsData.relative_alt ? gpsData.relative_alt / 1000 : 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className='flex flex-row items-center justify-center'>
            <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
              <p className='text-sm'>deg &#176;</p>
              <p>
                HDG <br /> {(gpsData.hdg ? gpsData.hdg / 100 : 0).toFixed(2)}
              </p>
              <p>
                YAW <br /> {(attitudeData.yaw ? attitudeData.yaw * (180 / Math.PI) : 0).toFixed(2)}
              </p>
            </div>
            <HeadingIndicator heading={gpsData.hdg ? gpsData.hdg / 100 : 0} />
            <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
              <p className='text-sm'>m</p>
              <p>
                WP <br />{' '}
                {(navControllerOutputData.wp_dist ? navControllerOutputData.wp_dist : 0).toFixed(2)}
              </p>
              <p>
                HOME <br /> {(0).toFixed(2)}
              </p>
              {/* TOOD: Implement distance to home */}
            </div>
          </div>
          <div className='flex flex-col items-center'>
            <p>BATTERY</p>
            <div className='flex flex-row space-x-4'>
              <p>{(batteryData.voltages ? batteryData.voltages[0] / 1000 : 0).toFixed(2)}V</p>
              <p>
                {(batteryData.current_battery ? batteryData.current_battery / 100 : 0).toFixed(2)}A
              </p>
              <p>{batteryData.battery_remaining ? batteryData.battery_remaining : 0}%</p>
            </div>
          </div>
          <div>
            <Button
              onClick={() => {
                armDisarm(!getIsArmed())
              }}
            >
              {getIsArmed() ? 'Disarm' : 'Arm'}
            </Button>
          </div>
        </div>

        <StatusBar className='absolute top-0 right-0'>
          <StatusSection
            icon={<IconRadar />}
            value={GPS_FIX_TYPES[gpsRawIntData.fix_type]}
            tooltip='GPS fix type'
          />
          <StatusSection
            icon={<IconGps />}
            value={`(${gpsData.lat !== undefined ? gpsData.lat.toFixed(6) : 0}, ${
              gpsData.lon !== undefined ? gpsData.lon.toFixed(6) : 0
            })`}
            tooltip='GPS (lat, lon)'
          />
          <StatusSection
            icon={<IconSatellite />}
            value={gpsRawIntData.satellites_visible}
            tooltip='Satellites visible'
          />
          <StatusSection icon={<IconAntenna />} value={rcChannelsData.rssi} tooltip='RC RSSI' />
          <StatusSection
            icon={<IconBattery2 />}
            value={batteryData.battery_remaining ? `${batteryData.battery_remaining}%` : '0%'}
            tooltip='Battery remaining'
          />
        </StatusBar>

        {/* Right side floating toolbar */}
        <div className='absolute right-0 top-1/2 bg-falcongrey/80 py-4 px-2 rounded-tl-md rounded-bl-md'>
          <Tooltip
            label={
              !gpsData.lon && !gpsData.lat
                ? 'No GPS data'
                : followDrone
                  ? 'Stop Following'
                  : 'Follow Drone'
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
        </div>

        {statustextMessages.length !== 0 && (
          <StatusMessages
            messages={statustextMessages}
            className='absolute bottom-0 left-0 bg-falcongrey/80 max-w-1/2'
          />
        )}
      </div>
    </Layout>
  )
}
