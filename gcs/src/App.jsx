import { useListState, useLocalStorage } from '@mantine/hooks'
import {
  IconAntenna,
  IconBattery2,
  IconGps,
  IconRadar,
  IconSatellite,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { AttitudeIndicator, HeadingIndicator } from './components/indicator'
import StatusBar, { StatusSection } from './components/statusBar'
import {
  COPTER_MODES,
  GPS_FIX_TYPES,
  MAV_STATE,
  PLANE_MODES,
} from './mavlinkConstants'

import Layout from './components/layout'
import MapSection from './components/map'
import StatusMessages from './components/statusMessages'
import { socket } from './socket'

export default function App() {
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
  const [sysStatusData, setSysStatusData] = useState({})
  const [gpsRawIntData, setGpsRawIntData] = useState({
    fix_type: 0,
    satellites_visible: 0,
  })
  const [rcChannelsData, setRCChannelsData] = useState({ rssi: 0 })

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit('set_state', { state: 'dashboard' })
      statustextMessagesHandler.setState([])
    }

    socket.on('incoming_msg', (msg) => {
      switch (msg.mavpackettype) {
        case 'VFR_HUD':
          setTelemetryData(msg)
          break
        case 'BATTERY_STATUS':
          setBatteryData(msg)
          break
        case 'ATTITUDE':
          setAttitudeData(msg)
          break
        case 'GLOBAL_POSITION_INT':
          setGpsData(msg)
          break
        case 'NAV_CONTROLLER_OUTPUT':
          setNavControllerOutputData(msg)
          break
        case 'HEARTBEAT':
          if (msg.autopilot !== 8) {
            setHeartbeatData(msg)
          }
          break
        case 'STATUSTEXT':
          statustextMessagesHandler.prepend(msg)
          break
        case 'SYS_STATUS':
          setSysStatusData(msg)
          break
        case 'GPS_RAW_INT':
          setGpsRawIntData(msg)
          break
        case 'RC_CHANNELS':
          setRCChannelsData(msg)
          break
        default:
          break
      }
    })

    return () => {
      socket.off('incoming_msg')
    }
  }, [connected])

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

  function getIsArmable() {
    // Checks if prearm check is enabled, if yes then not armable
    // TOOD: test if this returns true if all checks pass
    return !(sysStatusData.onboard_control_sensors_enabled & 268435456)
  }

  return (
    <Layout currentPage='dashboard'>
      <div className='flex w-full h-full flex-auto relative'>
        <div className='w-full'>
          <MapSection
            data={gpsData}
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
          />
        </div>
        <div className='absolute top-0 left-0 bg-falcongrey/80 p-4'>
          <div className='flex flex-col space-y-2 items-center'>
            {getIsArmed() ? (
              <p className='text-falconred font-bold'>ARMED</p>
            ) : (
              <>
                <p className='font-bold'>DISARMED</p>
                {getIsArmable() ? (
                  <p className='text-falconred'>Not Ready to Arm</p>
                ) : (
                  <p className='text-green-500 font-bold'>Ready to Arm</p>
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
                AS <br />{' '}
                {(telemetryData.airspeed ? telemetryData.airspeed : 0).toFixed(
                  2,
                )}
              </p>
              <p>
                GS <br />{' '}
                {(telemetryData.groundspeed
                  ? telemetryData.groundspeed
                  : 0
                ).toFixed(2)}
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
                AREL <br />{' '}
                {(gpsData.relative_alt
                  ? gpsData.relative_alt / 1000
                  : 0
                ).toFixed(2)}
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
                YAW <br />{' '}
                {(attitudeData.yaw
                  ? attitudeData.yaw * (180 / Math.PI)
                  : 0
                ).toFixed(2)}
              </p>
            </div>
            <HeadingIndicator heading={gpsData.hdg ? gpsData.hdg / 100 : 0} />
            <div className='flex flex-col items-center justify-center w-10 space-y-4 text-center'>
              <p className='text-sm'>m</p>
              <p>
                WP <br />{' '}
                {(navControllerOutputData.wp_dist
                  ? navControllerOutputData.wp_dist
                  : 0
                ).toFixed(2)}
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
              <p>
                {(batteryData.voltages
                  ? batteryData.voltages[0] / 1000
                  : 0
                ).toFixed(2)}
                V
              </p>
              <p>
                {(batteryData.current_battery
                  ? batteryData.current_battery / 100
                  : 0
                ).toFixed(2)}
                A
              </p>
              <p>
                {batteryData.battery_remaining
                  ? batteryData.battery_remaining
                  : 0}
                %
              </p>
            </div>
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
            value={`(${
              gpsData.lat !== undefined ? gpsData.lat.toFixed(6) : 0
            }, ${gpsData.lon !== undefined ? gpsData.lon.toFixed(6) : 0})`}
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

        {statustextMessages.length !== 0 && (
          <StatusMessages
            messages={statustextMessages}
            className='bg-falcongrey/80 absolute bottom-0 left-0 max-w-1/2'
          />
        )}
      </div>
    </Layout>
  )
}
