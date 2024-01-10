import { Button, Group, LoadingOverlay, Modal, Select } from '@mantine/core'
import { useDisclosure, useLocalStorage } from '@mantine/hooks'
import { useEffect, useState } from 'react'

import { IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'
import { showErrorNotification } from '../notification.js'
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
  const [fetchingComPorts, setFetchingComPorts] = useState(false)
  const [connecting, setConnecting] = useState(false)

  function getComPorts() {
    socket.emit('get_com_ports')
    setFetchingComPorts(true)
  }

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
        setConnecting(false)
        getComPorts()
      }
    })

    socket.on('list_com_ports', (msg) => {
      setFetchingComPorts(false)
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
      setConnecting(false)
      close()
    })

    socket.on('disconnected_from_drone', () => {
      console.log('disconnected_from_drone')
      setConnected(false)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('com_port_error', (msg) => {
      console.log(msg.message)
      showErrorNotification(msg.message)
      setConnecting(false)
    })

    return () => {
      socket.off('is_connected_to_drone')
      socket.off('list_com_ports')
      socket.off('connected_to_drone')
      socket.off('disconnected_from_drone')
      socket.off('disconnect')
      socket.off('com_port_error')
      setConnected(false)
    }
  }, [])

  function saveCOMData() {
    socket.emit('set_com_port', {
      port: selectedComPort,
      baud: selectedBaudRate,
    })
    setConnecting(true)
  }

  function disconnect() {
    console.log('disconnect')
    socket.emit('disconnect_from_drone')
  }

  const linkClassName =
    'text-md hover:text-falconred-60 transition-colors delay-50'
  return (
    <div className='flex flex-row space-x-6 items-center justify-center py-2 px-10'>
      <Modal
        opened={opened}
        onClose={close}
        title='Select COM Port'
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <LoadingOverlay visible={fetchingComPorts} />
        <Select
          label='COM Port'
          description='Select a COM Port from the ones available'
          placeholder={
            comPorts.length ? 'Select a COM port' : 'No COM ports found'
          }
          data={comPorts}
          value={selectedComPort}
          onChange={setSelectedComPort}
          rightSectionPointerEvents='all'
          rightSection={<IconRefresh />}
          rightSectionProps={{
            onClick: getComPorts,
            className: 'hover:cursor-pointer hover:bg-transparent/50',
          }}
        />
        <Select
          label='Baud Rate'
          description='Select a baud rate for the specified COM Port'
          data={[
            300, 1200, 4800, 9600, 19200, 13400, 38400, 57600, 74880, 115200,
            230400, 250000,
          ]}
          value={selectedBaudRate}
          onChange={setSelectedBaudRate}
        />
        <Group justify='space-between' className='pt-4'>
          <Button
            variant='filled'
            color={tailwindColors.red[600]}
            onClick={close}
          >
            Close
          </Button>
          <Button
            variant='filled'
            color={tailwindColors.green[600]}
            onClick={saveCOMData}
            data-autofocus
            disabled={selectedComPort === null}
            loading={connecting}
          >
            Connect
          </Button>
        </Group>
      </Modal>

      <Link
        to='/'
        className={twMerge(
          linkClassName,
          currentPage === 'dashboard' && 'text-falconred font-bold',
        )}
      >
        Dashboard
      </Link>
      <Link
        to='/graphs'
        className={twMerge(
          linkClassName,
          currentPage === 'graphs' && 'text-falconred font-bold',
        )}
      >
        Graphs
      </Link>
      <Link
        to='/params'
        className={twMerge(
          linkClassName,
          currentPage === 'params' && 'text-falconred font-bold',
        )}
      >
        Params
      </Link>
      <Link
        to='/all-data'
        className={twMerge(
          linkClassName,
          currentPage === 'all-data' && 'text-falconred font-bold',
        )}
      >
        All data
      </Link>
      <div className='!ml-auto flex flex-row space-x-4 items-center'>
        <p>{connected && selectedComPort}</p>
        <Button
          onClick={connected ? disconnect : open}
          color={
            connected ? tailwindColors.red[600] : tailwindColors.green[600]
          }
        >
          {connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}
