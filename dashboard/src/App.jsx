import { useEffect, useState } from 'react'

import BatterySection from './components/battery'
import GraphArray from './components/graphArray'
import InfoCard from './components/infoCard'
import MapSection from './components/map'
import { io } from 'socket.io-client'
import moment from 'moment'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'

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
    <div className="bg-zinc-600 w-sreen h-screen flex flex-col justify-around">
      <div className="flex flex-row w-full">
        {/* grid wrapper for flight telemetry */}
        <div className="grid grid-cols-1 grid-rows-4 gap-3 m-2  w-2/6">
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
        <div className="grid grid-cols-1 grid-rows-1 gap-3 p-2 w-3/6">
          <MapSection data={gpsData} />
        </div>

        {/** grid wrapper for battery data */}
        <div className="grid grid-cols-1 grid-rows-1 gap-2 m-2  w-2/6">
          <BatterySection data={batteryData} />
        </div>
      </div>

      <GraphArray
        // TODO: Fix graphs
        graphs={[
          {
            data: {
              x: time,
              y: parseFloat(
                batteryData.voltages && batteryData.voltages[0] / 1000
              )
            },
            datasetLabel: 'Battery Voltage',
            lineColor: tailwindColors.red['400'],
            pointColor: tailwindColors.red['600']
          },
          {
            data: {
              x: time,
              y: parseFloat(batteryData['current_battery'] / 100)
            },
            datasetLabel: 'Battery Current',
            lineColor: tailwindColors.cyan['400'],
            pointColor: tailwindColors.cyan['600']
          },
          {
            data: {
              x: time,
              y: parseFloat(telemetryData['airspeed'])
            },
            datasetLabel: 'Airspeed',
            lineColor: tailwindColors.yellow['400'],
            pointColor: tailwindColors.yellow['600'],
            maxNumberOfDataPoints: 50
          }
        ]}
      />
    </div>
  )
}
