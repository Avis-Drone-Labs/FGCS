import { useEffect, useState } from 'react'

import BatterySection from './components/battery'
import GraphArray from './components/graphArray'
import InfoCard from './components/infoCard'
import MapSection from './components/map'
import { socket } from './socket'
import moment from 'moment'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import Layout from './components/layout'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function App() {
  const [listening, setListening] = useState(false)
  const [telemetryData, setTelemetryData] = useState({})
  const [gpsData, setGpsData] = useState({})
  const [batteryData, setBatteryData] = useState({})
  const [time, setTime] = useState(null)

  useEffect(() => {
    socket.emit('set_state', { state: 'dashboard' })

    socket.on('incoming_msg', (msg) => {
      switch (msg.mavpackettype) {
        case 'VFR_HUD':
          setTelemetryData(msg)
          break
        case 'BATTERY_STATUS':
          setBatteryData(msg)
          break
        case 'ATTITUDE':
          // TODO
          break
        case 'GLOBAL_POSITION_INT':
          setGpsData(msg)
          break
        default:
          break
      }
      setTime(moment.unix(msg.timestamp))
    })

    return () => {
      socket.off('incoming_msg')
    }
  })

  return (
    <Layout currentPage="dashboard">
      <div className="flex w-full flex-auto">
        {/* grid wrapper for flight telemetry */}
        <div className="flex-auto">
          <InfoCard text="Altitude" metric={telemetryData['alt']} unit="m" />
          <InfoCard
            text="Airspeed"
            metric={telemetryData['airspeed']}
            unit="m/s"
          />
          <InfoCard text="System Status" metric={telemetryData['status']} />
          <InfoCard text="FTS Active" metric={'FALSE'} />
          <InfoCard
            text="Ground Speed"
            metric={telemetryData['groundspeed']}
            unit="m/s"
          />
        </div>

        {/** grid wrapper for map data */}
        <div className="w-7/12">
          <MapSection data={gpsData} />
        </div>
      </div>
    </Layout>
  )
}
