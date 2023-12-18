import { useEffect, useState } from 'react'

import BatterySection from './components/battery'
import GraphArray from './components/graphArray'
import InfoCard from './components/infoCard'
import MapSection from './components/map'
import { io } from 'socket.io-client'
import moment from 'moment'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import Layout from './components/layout'

const URL = 'http://127.0.0.1:5000'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function App() {
  const [listening, setListening] = useState(false)
  const [telemetryData, setTelemetryData] = useState({})
  const [gpsData, setGpsData] = useState({})
  const [batteryData, setBatteryData] = useState({})
  const [time, setTime] = useState(null)

  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!listening) {
      setListening(true)
      const _socket = io(URL)
      setSocket(_socket)

      _socket.on('connect', () => {
        console.log(`Connected to socket, ${_socket.id}`)
        setConnected(true)
      })

      _socket.on('disconnect', () => {
        console.log('Disconnected from socket')
        setConnected(false)
      })

      _socket.on('incoming_msg', (msg) => {
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
    }
  }, [listening])

  useEffect(() => {
    if (!connected || !socket) {
      return
    }

    // Use effect for on connect

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected])

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
