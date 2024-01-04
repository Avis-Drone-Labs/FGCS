import { Button, Group, Modal, Select } from '@mantine/core'
import { useDisclosure, useLocalStorage } from '@mantine/hooks'
import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'
import { socket } from '../socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {
  const [connected, setConnected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [opened, { open, close }] = useDisclosure(false)
  const [comPorts, setComPorts] = useState([])
  const [selectedComPort, setSelectedComPort] = useState(null)
  const [selectedBaudRate, setSelectedBaudRate] = useState('9600')

  useEffect(() => {
    if (selectedComPort === null) {
      console.log('check connection to drone')
      socket.emit('is_connected_to_drone')
    }

    socket.on('is_connected_to_drone', (msg) => {
      if (msg) {
        setConnected(true)
      } else {
        setConnected(false)
        socket.emit('get_com_ports')
      }
    })

    socket.on('list_com_ports', (msg) => {
      console.log(msg)
      setComPorts(msg)
      const possibleComPort = msg.find((port) =>
        port.toLowerCase().includes('mavlink'),
      )
      if (possibleComPort !== undefined) {
        setSelectedComPort(possibleComPort)
      } else if (msg.length > 0) {
        setSelectedComPort(msg[0])
      }
    })

    socket.on('connected_to_drone', () => {
      console.log('connected to drone')
      setConnected(true)
    })

    socket.on('disconnected_from_drone', () => {
      console.log('disconnected_from_drone')
      setConnected(false)
    })

    return () => {
      socket.off('is_connected_to_drone')
      socket.off('list_com_ports')
      socket.off('connected_to_drone')
      socket.off('disconnected_from_drone')
      setConnected(false)
    }
  }, [])

  function saveCOMData() {
    socket.emit('set_com_port', {
      port: selectedComPort,
      baud: selectedBaudRate,
    })
    close()
  }

  function disconnect() {
    console.log('disconnect')
    socket.emit('disconnect_from_drone')
  }

  const linkClassName =
    'text-md hover:text-falconred-60 transition-colors delay-50'
  return (
    <div className="flex flex-row space-x-6 items-center justify-center py-2 px-10">
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
        <Select
          label="COM Port"
          description="Select a COM Port from the ones available"
          data={comPorts}
          value={selectedComPort}
          onChange={setSelectedComPort}
        />
        <Select
          label="Baud Rate"
          description="Select a baud rate for the specified COM Port"
          data={[
            300, 1200, 4800, 9600, 19200, 13400, 38400, 57600, 74880, 115200,
            230400, 250000,
          ]}
          value={selectedBaudRate}
          onChange={setSelectedBaudRate}
        />
        <Group justify="space-between" className="pt-4">
          <Button
            variant="filled"
            color={tailwindColors.red[600]}
            onClick={close}
          >
            Close
          </Button>
          <Button
            variant="filled"
            color={tailwindColors.green[600]}
            onClick={saveCOMData}
          >
            Save
          </Button>
        </Group>
      </Modal>

      <Link
        to="/"
        className={twMerge(
          linkClassName,
          currentPage === 'dashboard' && 'text-falconred font-bold',
        )}
      >
        Dashboard
      </Link>
      <Link
        to="/graphs"
        className={twMerge(
          linkClassName,
          currentPage === 'graphs' && 'text-falconred font-bold',
        )}
      >
        Graphs
      </Link>
      <Link
        to="/params"
        className={twMerge(
          linkClassName,
          currentPage === 'params' && 'text-falconred font-bold',
        )}
      >
        Params
      </Link>
      <Link
        to="/all-data"
        className={twMerge(
          linkClassName,
          currentPage === 'all-data' && 'text-falconred font-bold',
        )}
      >
        All data
      </Link>
      <div className="!ml-auto flex flex-row space-x-4 items-center">
        <p>{connected && selectedComPort}</p>
        <Button onClick={connected ? disconnect : open}>
          {connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}
