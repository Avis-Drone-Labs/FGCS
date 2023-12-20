import { useEffect, useState } from 'react'

import InfoCard from './components/infoCard'
import Layout from './components/layout'
import MapSection from './components/map'
import moment from 'moment'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import { socket } from './socket'
import { useDisclosure } from '@mantine/hooks';
import { Modal, NativeSelect, Button, Group } from '@mantine/core';

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function App() {
  const [listening, setListening] = useState(false)
  const [telemetryData, setTelemetryData] = useState({})
  const [gpsData, setGpsData] = useState({})
  const [batteryData, setBatteryData] = useState({})
  const [time, setTime] = useState(null)
  const [opened, { open, close }] = useDisclosure(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!listening) {
      socket.emit('set_state', { state: 'dashboard' })
      setListening(true)
    }
  })

  useEffect(() => {
    if (!listening) {
      return
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
      setListening(false)
    }
  }, [listening])

  function saveCOMData() {
    console.log("Hello");
    close();
  }

  return (
    <Layout currentPage="dashboard">
      <Modal 
        opened={opened} 
        onClose={close} 
        title="Set COM Port" 
        centered 
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <NativeSelect 
          label="COM Port" 
          description="Select a COM Port from the ones available"
          data={[]}
        />
        <NativeSelect 
          label="Baud Rate" 
          description="Select a baud rate for the specified COM Port"
          data={[300, 1200, 4800, 9600, 19200, 13400, 38400, 57600, 74880, 115200, 230400, 250000]}
          defaultValue={9600}
        />
        <Group justify="space-between" className="pt-4">
          <Button variant="filled" color={tailwindColors.red[600]} onClick={close}>Close</Button>
          <Button variant="filled" color={tailwindColors.green[600]} onClick={saveCOMData}>Save</Button>
        </Group>
      </Modal>

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
