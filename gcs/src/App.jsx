import { useEffect, useState } from 'react'
import { AttitudeIndicator, HeadingIndicator } from './components/indicator'
import { COPTER_MODES, MAV_STATE, PLANE_MODES } from './mavlinkConstants'

import { useLocalStorage } from '@mantine/hooks'
import moment from 'moment'
import Layout from './components/layout'
import MapSection from './components/map'
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
  const [statustextData, setStatustextData] = useState({})
  const [sysStatusData, setSysStatusData] = useState({})
  const [time, setTime] = useState(null)

  useEffect(() => {
    if (!connected) {
      setTelemetryData({})
      setGpsData({})
      setBatteryData({})
      setTime(null)
      return
    } else {
      socket.emit('set_state', { state: 'dashboard' })
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
          console.log(msg) // TODO: Accomodate for multiple status text messages and display all, incoming every 30s approx
          setStatustextData(msg)
          break
        case 'SYS_STATUS':
          setSysStatusData(msg)
          break
        default:
          break
      }
      setTime(moment.unix(msg.timestamp))
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
    <Layout currentPage="dashboard">
      <div className="flex w-full h-full flex-auto relative">
        <div className="w-full">
          <MapSection data={gpsData} />
        </div>
        <div className="absolute top-0 left-0 bg-falcongrey/75 p-4">
          <p className="text-center">
            {MAV_STATE[heartbeatData.system_status]}
          </p>
          <p className="text-center">{getFlightMode()}</p>
          <p className="text-center">{getIsArmed() ? 'ARMED' : 'DISARMED'}</p>
          <p className="text-center">
            {getIsArmable() && !getIsArmed()
              ? 'Ready to Arm'
              : 'Not Ready to Arm'}
          </p>
          <p className="text-center">{statustextData.text}</p>
          <div className="flex flex-row items-center justify-center">
            <div className="flex flex-col items-center justify-center w-10 space-y-4 text-center">
              <p className="text-sm">ms&#8315;&#185;</p>
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
            <div className="flex flex-col items-center justify-center w-10 space-y-4 text-center">
              <p className="text-sm">m</p>
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
          <div className="flex flex-row items-center justify-center">
            <div className="flex flex-col items-center justify-center w-10 space-y-4 text-center">
              <p className="text-sm">deg &#176;</p>
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
            <div className="flex flex-col items-center justify-center w-10 space-y-4 text-center">
              <p className="text-sm">m</p>
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
          <div className="flex flex-col items-center">
            <p>BATTERY</p>
            <div className="flex flex-row space-x-4">
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
        <div className="w-1/3 absolute bottom-0 left-0"></div>
      </div>
    </Layout>
  )
}
