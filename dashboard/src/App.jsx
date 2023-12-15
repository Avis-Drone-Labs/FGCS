import { useEffect, useState } from 'react'

import BatterySection from './components/battery'
import GraphArray from './components/graphArray'
import InfoCard from './components/infoCard'
import MapSection from './components/map'
import TelemetrySection from './components/telemetry'
import { io } from 'socket.io-client'
import moment from 'moment'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'

// import LoraSection from './components/lora'

const URL = 'http://127.0.0.1:5000'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function App() {
  const [listening, setListening] = useState(false)
  const [telemetryData, setTelemetryData] = useState({})
  // const [loraData, setLoraData] = useState({})
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

      _socket.on('set_telemetry', (data) => {
        setTelemetryData(data)
        setTime(moment.unix(data._timestamp))
      })

      _socket.on('set_battery', (data) => {
        setBatteryData(data)
        setTime(moment.unix(data._timestamp))
      })

      _socket.on('set_gps', (data) => {
        setGpsData(data)
        setTime(moment.unix(data._timestamp))
      })
    }
  }, [listening])

  useEffect(() => {
    if (!connected || !socket) {
      return
    }

    // function requestData() {
    //   console.log('requesting data')
    //   socket.emit('req_time')
    //   socket.emit('req_telemetry')
    //   socket.emit('req_battery')
    //   socket.emit('req_gps')
    // }

    // const interval = setInterval(requestData, 1000)

    // return () => {
    //   clearInterval(interval)
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected])

  return (
    <div className="bg-zinc-600 w-sreen h-screen flex flex-col justify-around">
      <div className="flex flex-row w-full"> 
      {/* grid wrapper for flight telemetry */}
      <div className="grid grid-cols-1 grid-rows-4 gap-3 m-2  w-2/6">
        <InfoCard
          text="Altitude"
          metric={telemetryData['altitude']}
          unit="m"
        />
        <InfoCard
          text="Airspeed"
          metric={telemetryData['airspeed']}
          unit="m/s"
        />
        <InfoCard text="System Status" metric={telemetryData['status']} />
        <InfoCard text="FTS Active" metric={'FALSE'} />
        <InfoCard text="Ground Speed" metric={telemetryData['groundspeed']} unit='m/s' />
      </div>

      {/** grid wrapper for map data */}
      <div className="grid grid-cols-1 grid-rows-1 gap-3 p-2 w-3/6">
        <MapSection data={gpsData} />
      </div>
    
      {/** grid wrapper for battery data */}
      <div className="grid grid-cols-1 grid-rows-1 gap-2 m-2  w-2/6">
        <BatterySection data={batteryData} />
      </div>
        
        {/**
         Removed telemetry section due to duplicate data
        <TelemetrySection data={telemetryData} />
        */}
        {/* <LoraSection data={loraData} /> */}
      </div>

      <GraphArray
        graphs={[
          {
            data: {
              x: time,
              y: parseFloat(batteryData['battery_voltage']),
            },
            datasetLabel: 'Battery Voltage',
            lineColor: tailwindColors.red['400'],
            pointColor: tailwindColors.red['600'],
          },
          {
            data: {
              x: time,
              y: parseFloat(batteryData['battery_current']),
            },
            datasetLabel: 'Battery Current',
            lineColor: tailwindColors.cyan['400'],
            pointColor: tailwindColors.cyan['600'],
          },
          {
            data: {
              x: time,
              y: parseFloat(telemetryData['airspeed']),
            },
            datasetLabel: 'Airspeed',
            lineColor: tailwindColors.yellow['400'],
            pointColor: tailwindColors.yellow['600'],
            maxNumberOfDataPoints: 50,
          },
        ]}
        />
    
    </div>

  )
}
