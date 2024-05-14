/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this 
  is where it is loaded. This also handles the connections to the drone as this is always loaded, 
  in the future we may change this so that its loaded in its own component.
*/

// Base imports
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ComPortModal from './comPortModal.jsx'

// Third party imports
import { Button, Tooltip } from '@mantine/core'
import {
  useDisclosure,
  useInterval,
  useLocalStorage,
  useSessionStorage,
} from '@mantine/hooks'

// Styling imports
import { twMerge } from 'tailwind-merge'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

// Helper imports
import { showErrorNotification } from '../helpers/notification.js'
import { socket } from '../helpers/socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {
  // Panel is open/closed
  const [opened, { open, close }] = useDisclosure(false)

  // Connection to drone
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [wireless, setWireless] = useLocalStorage({
    key: 'wirelessConnection',
    defaultValue: true,
  })
  const [connectedToSocket, setConnectedToSocket] = useSessionStorage({
    key: 'socketConnection',
    defaultValue: false,
  })
  const checkIfConnectedToSocket = useInterval(
    () => setConnectedToSocket(socket.connected),
    3000,
  )
  const [selectedBaudRate, setSelectedBaudRate] = useLocalStorage({
    key: 'baudrate',
    defaultValue: '9600',
  })

  const [setAircraftType] = useLocalStorage({
    key: 'aircraftType',
    defaultValue: 0,
  })

  // Com Ports
  const [comPorts, setComPorts] = useState([])
  const [selectedComPort, setSelectedComPort] = useState(null)
  const [fetchingComPorts, setFetchingComPorts] = useState(false)

  function getComPorts() {
    if (!connectedToSocket) return
    socket.emit('get_com_ports')
    setFetchingComPorts(true)
  }

  // Check if connected to drone
  useEffect(() => {
    checkIfConnectedToSocket.start()

    if (selectedComPort === null) {
      console.log('check connection to drone')
      socket.emit('is_connected_to_drone')
    }

    // Flag connected/not connected, if not fetch ports
    socket.on('is_connected_to_drone', (msg) => {
      if (msg) {
        setConnected(true)
      } else {
        setConnected(false)
        setConnecting(false)
        getComPorts()
      }
    })

    // Fetch com ports and list them
    socket.on('list_com_ports', (msg) => {
      setFetchingComPorts(false)
      setComPorts(msg)
      const possibleComPort = msg.find(
        (port) =>
          port.toLowerCase().includes('mavlink') ||
          port.toLowerCase().includes('ardupilot'),
      )
      if (possibleComPort !== undefined) {
        setSelectedComPort(possibleComPort)
      } else if (msg.length > 0) {
        setSelectedComPort(msg[0])
      }
    })

    // Flags that the drone is connected
    socket.on('connected_to_drone', (data) => {
      console.log(`connected to drone of type ${data.aircraft_type}`)
      setAircraftType(data.aircraft_type)
      setConnected(true)
      setConnecting(false)
      close()
    })

    // Flags that the drone is disconnected
    socket.on('disconnected_from_drone', () => {
      console.log('disconnected_from_drone')
      setConnected(false)
    })

    // Handles disconnect trigger
    socket.on('disconnect', () => {
      setConnected(false)
      setConnecting(false)
    })

    // Flags an error with the com port
    socket.on('com_port_error', (msg) => {
      console.log(msg.message)
      showErrorNotification(msg.message)
      setConnecting(false)
      setConnected(false)
    })

    return () => {
      checkIfConnectedToSocket.stop()
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
      wireless: wireless,
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
    <div className='flex flex-row items-center justify-center px-10 py-2 space-x-6'>
      <ComPortModal
        opened={opened}
        comPorts={comPorts}
        selectedComPort={selectedComPort}
        selectedBaudRate={selectedBaudRate}
        wireless={wireless}
        fetchingComPorts={fetchingComPorts}
        connecting={connecting}
        connectedToSocket={connectedToSocket}
        saveCOMData={saveCOMData}
        setConnecting={setConnecting}
        setSelectedComPort={setSelectedComPort}
        setSelectedBaudRate={setSelectedBaudRate}
        setWireless={setWireless}
        close={close}
        getComPorts={getComPorts}
      />

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
        to='/config'
        className={twMerge(
          linkClassName,
          currentPage === 'config' && 'text-falconred font-bold',
        )}
      >
        Config
      </Link>
      <Link
        to='/fla'
        className={twMerge(
          linkClassName,
          currentPage === 'fla' && 'text-falconred font-bold',
        )}
      >
        FLA
      </Link>

      <div className='!ml-auto flex flex-row space-x-4 items-center'>
        <p>{connected && selectedComPort}</p>
        {connectedToSocket ? (
          <Button
            onClick={
              connected
                ? disconnect
                : () => {
                    getComPorts()
                    open()
                  }
            }
            color={
              connected ? tailwindColors.red[600] : tailwindColors.green[600]
            }
          >
            {connected ? 'Disconnect' : 'Connect'}
          </Button>
        ) : (
          <Tooltip label='Not connected to socket'>
            <Button data-disabled onClick={(event) => event.preventDefault()}>
              Connect
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
